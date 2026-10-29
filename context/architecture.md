# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime | Expo + React Native + TypeScript | Aplicación móvil multiplataforma y tipada |
| Navigation | Expo Router | Rutas, grupos autenticados y deep links |
| Safe areas | react-native-safe-area-context | Márgenes seguros en pantallas, navegación y overlays |
| UI | NativeWind | Estilos utilitarios consistentes para React Native |
| Builds & delivery | EAS Build / Submit / Update | Builds de Android/iOS y actualizaciones OTA |
| Backend | Supabase | Auth de cuenta única, PostgreSQL y Storage |
| Documentos | Edge Functions + Storage | Generación del PDF desde el snapshot y entrega por signed URL |
| Validation | Zod + React Hook Form | Validación y manejo de formularios |
| Server cache | TanStack Query | Lectura, caché e invalidación de datos remotos |
| Local state | Zustand | Preferencias y estado efímero, no datos de negocio |

## System Boundaries

- `app/` — rutas Expo Router y pantallas delgadas; no contiene reglas de negocio.
- `features/` — casos de uso por dominio (`contracts`, `clients`, `events`) con sus schemas, hooks y UI cercana.
- `components/` — componentes presentacionales reutilizables, sin conocimiento de Supabase.
- `lib/` — cliente Supabase, validadores, formateadores y manejo de errores compartidos.
- `stores/` — estado temporal de UI y preferencias; no duplica registros persistidos.
- `types/` — tipos compartidos, idealmente generados o alineados con el esquema de Supabase.
- `supabase/` — migraciones SQL, seed, políticas RLS y Edge Functions versionadas.
- `context/` — especificaciones vivas del producto; no se importa desde producción.

## Storage Model

- **PostgreSQL (Supabase)**: `clients`, `events`, `service_catalog`, `contract_templates`, `contracts`, `contract_payments`, `contract_documents` y `contract_audit_log`. Todos los registros de negocio incluyen `created_at` y `updated_at`; no existe una tabla de usuarios ni roles.
- **Supabase Storage**: bucket privado `contract-documents` para PDFs generados y, si se aprueba el requisito, evidencias de firma. Los archivos se organizan por `contract_id` y versión, y se protegen con políticas equivalentes a las del contrato.
- **SecureStore del dispositivo**: únicamente tokens de sesión gestionados por Supabase y secretos locales estrictamente necesarios; nunca contratos como fuente de verdad.

Los importes se guardan como enteros en céntimos para evitar errores de punto flotante. El pago se modela en `contract_payments` (append-only): el "a cuenta" y el saldo se derivan de `sum(amount_cents)` y nunca se editan como columnas del contrato. El saldo se calcula en servidor como `total_amount_cents − sum(pagos)`; un contrato no puede recibir pagos que superen el total. Un contrato conserva una instantánea de la plantilla y cláusulas para que cambios posteriores no alteren documentos históricos. La especificación detallada de campos impresos está en `context/contract-template.md`.

### Pagos

- `contract_payments` registra `contract_id`, `amount_cents`, `kind` (`deposit` | `balance`), `method` (`efectivo` | `yape` | `plin` | `transferencia` | `otro`), `paid_at`, `note`, `created_at`.
- El primer pago suele ser el adelanto, pero el modelo admite cualquier secuencia de abonos.
- El PDF confirmado congela el "a cuenta" y el saldo del momento de la firma; los abonos posteriores se reflejan en el detalle y la auditoría, no en el documento ya emitido.

### Plantillas y documentos

- `contract_templates` guarda versiones inmutables (`version`, `conditions` en JSONB, `brand_snapshot`, `is_active`). Ajustes crea una versión nueva; nunca actualiza una existente. Solo una versión está activa.
- `contracts` referencia `template_id` y guarda `template_snapshot` al confirmar.
- `contract_documents` registra `contract_id`, `storage_path`, `sha256`, `template_version` y `generated_at`.
- El PDF lo genera la Edge Function `generate-contract-pdf` desde el snapshot y se entrega con signed URL de corta duración; la app ofrece descarga y compartir por WhatsApp.

## Single-Operator Access Model

- Existe una única cuenta propietaria de Supabase Auth para la responsable de Anggely Kids.
- La app ofrece únicamente inicio de sesión, cierre de sesión y recuperación de contraseña para esta cuenta; no hay registro abierto, perfiles, roles, invitaciones ni administración de usuarios.
- Cada registro se vincula a `auth.uid()` mediante `owner_id`. RLS permite que solo la cuenta propietaria consulte o modifique los datos.
- La bitácora registra acción, momento y cambios; no requiere distinguir actores porque la operación es individual.
- La misma cuenta puede iniciar sesión en un teléfono nuevo o tras una reinstalación y recuperar sus contratos, documentos y catálogo.
- El cliente móvil nunca incorpora la `service_role` key. La generación de un número definitivo o documento protegido se hace con una Edge Function, no desde el cliente.

## Invariants

1. Toda lectura o mutación de información de clientes y contratos requiere la sesión de la cuenta propietaria y pasa por RLS.
2. Un contrato en `firmado` es inmutable en sus términos comerciales; las correcciones se representan anulando el contrato y creando uno nuevo enlazado (`supersedes_contract_id`).
3. El número de contrato se asigna una vez y no se reutiliza, incluso si el contrato se cancela o anula.
4. Cada cambio de estado y toda modificación relevante genera una entrada de auditoría con acción y fecha.
5. El PDF o documento generado se asocia a una versión/snapshot del contrato, nunca a datos mutables sin identificar.
6. Las claves secretas, incluida `SUPABASE_SERVICE_ROLE_KEY`, nunca se incluyen en la app ni en EAS public environment variables.
7. La suma de pagos de un contrato nunca supera el monto total acordado; el saldo siempre es derivado.
8. Las versiones de plantilla son inmutables: un cambio de condiciones produce una versión nueva.

## Contract States

`borrador` → `pendiente_de_firma` → `firmado`

Estados alternativos: `cancelado` (no llegó a firmarse), `anulado` (se corrige un contrato firmado) y `archivado` (oculto de las listas activas). La anulación exige motivo y fecha, y el contrato de reemplazo se crea duplicando el original como `borrador`.

## Core Data Relationships

```text
cuenta propietaria (1) ── posee ──< contracts >── (1) clients
                                      |
                                      ├── (1) events
                                      ├── (1) contract_templates [versión/snapshot]
                                      ├── (N) contract_payments
                                      ├── (N) contract_documents
                                      └── (N) contract_audit_log
```
