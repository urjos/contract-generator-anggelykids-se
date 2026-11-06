# Feature Spec 003 — Operaciones transaccionales de contratos

## Metadata

| Campo      | Valor                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| ID         | 003                                                                                                        |
| Estado     | Implementada y verificada en Supabase remoto                                                               |
| Fase       | 4 — Operaciones de contratos                                                                               |
| Depende de | Feature 002: modelo de datos inicial y RLS                                                                 |
| Habilita   | Feature 004: UI de contratos, listado, detalle e historial; Feature 005: PDF y Edge Function               |
| Fecha      | 2026-11-05                                                                                                 |
| Contexto   | `project-overview.md`, `architecture.md`, `contract-template.md`, `code-standards.md`, Feature 002         |

## 1. Problema

El esquema ya protege clientes, eventos, contratos, pagos, documentos y auditoría, pero todavía no existe una forma segura y transaccional de:

- confirmar un borrador y asignarle un número gapless;
- congelar la plantilla y la marca vigentes en un snapshot;
- marcar un contrato como firmado;
- registrar pagos y abonos sin superar el total;
- cancelar, anular, archivar o reemplazar contratos;
- consultar contratos con sus datos de cliente, evento y saldo en una sola lectura.

Si estas operaciones se hacen con `UPDATE` directos desde la app, se duplican reglas de negocio, se pueden saltar transiciones válidas y se pierde la trazabilidad semántica. La app tampoco debe acceder directamente a `contract_counters`.

## 2. Objetivo

Implementar la capa transaccional del servidor para el ciclo de vida del contrato:

`draft` → `pending_signature` → `signed`, con cancelación, anulación, reemplazo y archivo como transiciones controladas.

Toda transición debe ejecutarse mediante funciones `security definer` con verificación de propietario, estado y `version`; debe generar auditoría semántica y debe ser consumible desde la app mediante un servicio TypeScript tipado. Esta feature no incluye pantallas ni generación de PDF.

## 3. Alcance

### Incluye

- Migración nueva para funciones RPC de operaciones de contrato.
- Migración nueva para vista de lectura, permisos y revocación de escrituras directas de pagos.
- Helper interno para construir el snapshot de confirmación.
- RPC `confirm_contract` con numeración gapless, snapshot y transición a `pending_signature`.
- RPC `sign_contract` para pasar de `pending_signature` a `signed`.
- RPC `cancel_contract` para cancelar contratos no firmados con motivo y fecha.
- RPC `annul_and_replace_contract` para anular un contrato firmado y crear un borrador enlazado.
- RPC `archive_contract` para ocultar contratos cerrados de las listas activas.
- RPC `record_contract_payment` para registrar pagos append-only con validación de estado y total.
- Vista `contract_overview` para listado y detalle con cliente, evento y saldo derivado.
- Extensión del trigger de auditoría para registrar transiciones con datos semánticos y sin duplicados.
- Servicio TypeScript `features/contracts/contract-service.ts` con llamadas RPC tipadas.
- Esquemas Zod y traducción de errores de dominio en `features/contracts/`.
- Pruebas pgTAP para estados, numeración, pagos, reemplazo, permisos, auditoría y vista de lectura.
- Regeneración de `types/database.ts` y verificación con `npm run typecheck` / `npm run lint`.
- Actualización de `progress-tracker.md` y de la documentación afectada.

### No incluye

- Pantallas de listado, búsqueda, formulario, detalle o historial; se implementan en Feature 004.
- Generación de PDF, Edge Function, Storage de documentos, descarga o WhatsApp; Feature 005.
- Edición de plantillas o configuración de marca desde Ajustes.
- Cobros en línea, pasarelas de pago, facturación o conciliación bancaria.
- Firma gráfica del cliente; en el MVP solo se registra nombre y fecha.
- Notificaciones, recordatorios o calendario.
- Cambios de esquema en tablas existentes. Esta feature agrega funciones, una vista, triggers reemplazados y permisos.
- Pruebas de concurrencia real con múltiples conexiones; se validan las garantías de bloqueo y se documenta una prueba manual opcional.

## 4. Decisiones aplicadas

### 4.1 Máquina de estados

| Estado actual                | Acción RPC                  | Estado destino              | Reglas principales                                      |
| ---------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------- |
| `draft`                      | `confirm_contract`          | `pending_signature`         | Asigna número, snapshot y `confirmed_at`                |
| `draft` / `pending_signature`| `cancel_contract`           | `cancelled`                 | Exige motivo y fecha; conserva número si ya existía     |
| `pending_signature`          | `sign_contract`             | `signed`                    | Exige nombre de quien firma y fecha                     |
| `signed`                     | `annul_and_replace_contract`| `annulled` + nuevo `draft`  | Exige motivo; crea reemplazo enlazado                   |
| `signed` / `cancelled` / `annulled` | `archive_contract`  | `archived`                  | Solo oculta de listas activas; no borra datos           |
| `archived`                   | —                           | —                           | Solo lectura; sin transiciones salientes                |

- Un contrato `signed` no se edita ni se elimina: se anula y se reemplaza.
- Un borrador sigue siendo editable/eliminable directamente por RLS; las RPC solo controlan transiciones.
- Ninguna transición puede modificar `owner_id`, `created_at`, `contract_number` (salvo la asignación inicial), `confirmed_at`, `template_snapshot` ni los datos de firma.
- Cada RPC de transición bloquea la fila del contrato con `SELECT ... FOR UPDATE`, valida `version` y actualiza `version = version + 1`.
- `record_contract_payment` no incrementa `contracts.version`; inserta un movimiento append-only y el trigger de pagos bloquea el contrato para validar el total.
- Para que `archive_contract` funcione sobre contratos cancelados y anulados, la migración `00700` reemplaza `contracts_status_requirements` y permite que `archived` conserve `cancelled_at` y `cancellation_reason`.

### 4.2 Pagos

- Se permite registrar pagos en `draft`, `pending_signature` y `signed`, porque el flujo de producto captura el adelanto antes de confirmar.
- No se permiten pagos en `cancelled`, `annulled` ni `archived`.
- El primer pago suele ser `deposit`, pero el modelo admite cualquier secuencia de `deposit` y `balance`.
- El total pagado y el saldo se derivan de `contract_payments`; no se almacenan en `contracts`.
- Se revoca el `INSERT` directo de `contract_payments` a `authenticated`; toda escritura pasa por `record_contract_payment` para aplicar reglas de estado y auditoría.
- La corrección de un pago erróneo no se implementa en esta feature. Si se necesita, se hará con un movimiento de reverso con motivo en una feature posterior.

### 4.3 Confirmación y snapshot

- La confirmación exige que el contrato esté en `draft`, que el propietario coincida y que la `version` esperada sea la actual.
- La confirmación exige una plantilla activa del propietario y una fila de `brand_settings`.
- `template_id` se completa con la plantilla activa si el borrador no la tenía; si ya tenía una, debe seguir siendo la activa del propietario.
- El snapshot es inmutable y contiene la plantilla, la marca y los datos imprimibles del contrato, cliente y evento. Esto permite generar el PDF después sin depender de datos mutables.
- `brand_settings.logo_storage_path` y `signature_storage_path` pueden ser `null` al confirmar; la generación de PDF (Feature 005) decidirá si usa los activos por defecto o bloquea la generación.
- La confirmación exige `description` no vacía y `total_amount_cents > 0`; el resto de campos obligatorios ya está protegido por restricciones del esquema.
- La confirmación asigna `contract_number`, `template_snapshot` y `confirmed_at` juntos, como exige el esquema.

### 4.4 Numeración

- La serie única es `default` en `contract_counters`.
- El número se asigna al confirmar, no al crear el borrador.
- La RPC crea la fila del contador si no existe y luego la bloquea con `SELECT ... FOR UPDATE`.
- El contador se incrementa dentro de la misma transacción; un rollback no consume el número.
- El número máximo es `99999`; al intentar asignar uno mayor se lanza `contract_number_exhausted` y el contador no avanza.
- Cancelar, anular o archivar no reutiliza ni libera el número.

### 4.5 Reemplazo

- `annul_and_replace_contract` anula el contrato firmado y crea un borrador enlazado con `supersedes_contract_id`.
- El reemplazo requiere un `event_id` de reemplazo; si se omite, usa el mismo evento del contrato original para correcciones de datos.
- El reemplazo conserva cliente, descripción, importes, notas visibles, notas internas y `template_id`.
- El reemplazo no copia `contract_number`, `template_snapshot`, `confirmed_at`, `signed_at`, `signed_by_name` ni `signature_storage_path`; nace como borrador limpio.
- La anulación y la creación del reemplazo ocurren en la misma transacción. Si falla cualquiera de las dos, no queda una anulación huérfana.
- No se agrega una restricción única sobre `supersedes_contract_id`; la UI y la RPC garantizan una sustitución por operación. Si el producto exige una sola sustitución histórica, se evaluará en una migración posterior.

### 4.6 Auditoría

- Se reemplaza `audit_contract_change()` para incluir en `changes` los campos relevantes de la transición: estado, versión, número, confirmación, firma, motivo de cancelación y `supersedes_contract_id`.
- Las RPC no insertan filas de auditoría de contrato manualmente; el trigger sigue siendo la única fuente para altas y transiciones, evitando duplicados.
- Las acciones de estado son las existentes: `contract.confirmed`, `contract.signed`, `contract.cancelled`, `contract.annulled`, `contract.archived`.
- Un alta con `supersedes_contract_id` registra `contract.replacement_created` en lugar de `contract.created`.
- `payment.recorded` y `document.generated` se mantienen en sus triggers actuales.
- La auditoría es append-only y solo el propietario puede leerla.

### 4.7 Lectura y consultas

- Se agrega `contract_overview` como vista con `security_invoker = true`.
- La vista une `contracts`, `clients`, `events` y `contract_financials` para devolver los datos necesarios de listado y detalle.
- La vista hereda RLS de las tablas base; `anon` no recibe `SELECT`.
- No se agrega una función de búsqueda separada en esta feature. Feature 004 podrá filtrar la vista por número, cliente, teléfono, estado y rango de fechas usando PostgREST.

### 4.8 Seguridad

- Todas las RPC son `security definer` con `set search_path = public, pg_temp`.
- Cada RPC obtiene `auth.uid()` y rechaza la operación si no hay sesión o si el contrato no pertenece al usuario.
- Se revoca `EXECUTE` de `public` y `anon`; solo `authenticated` puede ejecutar las RPC.
- `contract_counters` sigue sin permisos para `authenticated`; solo las funciones internas la usan.
- El cliente móvil nunca usa `service_role`.
- Los mensajes de error usan tokens estables y la app los traduce; no se exponen datos personales ni detalles internos.

## 5. Historias de usuario

1. Como responsable, quiero confirmar un borrador para que reciba su número definitivo y quede listo para firma.
2. Como responsable, quiero que el contrato confirmado conserve la plantilla, las condiciones y la marca vigentes en ese momento.
3. Como responsable, quiero marcar un contrato como firmado con el nombre de quien confirma y la fecha.
4. Como responsable, quiero registrar el adelanto y los abonos sin que la suma supere el monto acordado.
5. Como responsable, quiero cancelar un contrato que no llegó a firmarse, dejando el motivo registrado.
6. Como responsable, quiero anular un contrato firmado con error y crear un reemplazo enlazado sin perder el historial.
7. Como responsable, quiero archivar contratos cerrados para que no aparezcan en las listas activas.
8. Como responsable, quiero ver en una sola consulta el cliente, evento, estado, número y saldo de cada contrato.
9. Como desarrollador, quiero que dos dispositivos no puedan confirmar o modificar el mismo contrato sin detectar el conflicto de versión.
10. Como desarrollador, quiero probar todas las transiciones y accesos denegados antes de construir la UI.

## 6. Contratos de API

### 6.1 RPC

Todas las funciones se crean en `public` y se otorgan solo a `authenticated`.

| Función | Parámetros | Retorno | Transición | Errores esperados |
| --- | --- | --- | --- | --- |
| `confirm_contract` | `p_contract_id uuid`, `p_expected_version integer` | `public.contracts` | `draft` → `pending_signature` | `contract_not_found`, `contract_forbidden`, `contract_invalid_transition`, `contract_version_mismatch`, `contract_incomplete`, `contract_template_unavailable`, `contract_brand_unavailable`, `contract_number_exhausted` |
| `sign_contract` | `p_contract_id uuid`, `p_expected_version integer`, `p_signed_by_name text`, `p_signed_at timestamptz default now()` | `public.contracts` | `pending_signature` → `signed` | `contract_not_found`, `contract_forbidden`, `contract_invalid_transition`, `contract_version_mismatch`, `invalid_input` |
| `cancel_contract` | `p_contract_id uuid`, `p_expected_version integer`, `p_reason text`, `p_cancelled_at timestamptz default now()` | `public.contracts` | `draft` / `pending_signature` → `cancelled` | `contract_not_found`, `contract_forbidden`, `contract_invalid_transition`, `contract_version_mismatch`, `invalid_input` |
| `annul_and_replace_contract` | `p_contract_id uuid`, `p_expected_version integer`, `p_reason text`, `p_cancelled_at timestamptz default now()`, `p_replacement_event_id uuid default null` | `jsonb` con `annulled_contract` y `replacement_contract` | `signed` → `annulled` + nuevo `draft` | `contract_not_found`, `contract_forbidden`, `contract_invalid_transition`, `contract_version_mismatch`, `invalid_input`, `replacement_event_invalid` |
| `archive_contract` | `p_contract_id uuid`, `p_expected_version integer` | `public.contracts` | `signed` / `cancelled` / `annulled` → `archived` | `contract_not_found`, `contract_forbidden`, `contract_invalid_transition`, `contract_version_mismatch` |
| `record_contract_payment` | `p_contract_id uuid`, `p_amount_cents integer`, `p_kind payment_kind`, `p_method payment_method`, `p_paid_at timestamptz default now()`, `p_note text default null` | `public.contract_payments` | Sin cambio de estado | `contract_not_found`, `contract_forbidden`, `payment_state_not_allowed`, `invalid_input`, `payment_exceeds_total` |

Notas de implementación:

- `confirm_contract` construye el snapshot, asigna el número y actualiza el contrato en una sola transacción.
- `annul_and_replace_contract` devuelve `jsonb` porque necesita retornar dos filas; la app valida la forma con Zod.
- Todas las funciones bloquean el contrato con `FOR UPDATE` antes de validar estado y versión.
- Las funciones internas de numeración y snapshot no se otorgan a `authenticated`.

### 6.2 Vista `contract_overview`

Columnas mínimas:

| Columna | Origen |
| --- | --- |
| `contract_id` | `contracts.id` |
| `owner_id` | `contracts.owner_id` |
| `contract_number` | `contracts.contract_number` |
| `status` | `contracts.status` |
| `version` | `contracts.version` |
| `description` | `contracts.description` |
| `total_amount_cents` | `contracts.total_amount_cents` |
| `mobility_amount_cents` | `contracts.mobility_amount_cents` |
| `paid_amount_cents` | `contract_financials.paid_amount_cents` |
| `balance_cents` | `contract_financials.balance_cents` |
| `client_name` | `clients.full_name` |
| `client_phone` | `clients.phone_e164` |
| `event_starts_at` | `events.starts_at` |
| `event_type` | `events.event_type` |
| `venue_name` | `events.venue_name` |
| `venue_address` | `events.venue_address` |
| `district` / `city` | `events.district` / `events.city` |
| `guest_count` | `events.guest_count` |
| `client_visible_notes` / `internal_notes` | `contracts.*` |
| `template_id` / `template_snapshot` | `contracts.*` |
| `supersedes_contract_id` | `contracts.supersedes_contract_id` |
| `confirmed_at` / `signed_at` / `cancelled_at` / `cancellation_reason` | `contracts.*` |
| `created_at` / `updated_at` | `contracts.*` |

- La vista se crea con `security_invoker = true`.
- Se otorga `SELECT` solo a `authenticated`.
- Los importes se devuelven en céntimos; el formateo a PEN queda en la app.

## 7. Snapshot de confirmación

`template_snapshot` se guarda como objeto JSONB con esta forma estable:

```json
{
  "schema_version": 1,
  "generated_at": "2026-11-05T12:00:00Z",
  "template": {
    "id": "uuid",
    "version": 1,
    "conditions": ["..."]
  },
  "brand": {
    "business_name": "Anggely Kids Shows y Eventos",
    "phone": "...",
    "whatsapp": "...",
    "social_links": {},
    "logo_storage_path": null,
    "signature_storage_path": null
  },
  "contract": {
    "description": "...",
    "total_amount_cents": 0,
    "mobility_amount_cents": 0,
    "client_visible_notes": null
  },
  "client": {
    "id": "uuid",
    "full_name": "...",
    "phone_e164": "+51..."
  },
  "event": {
    "id": "uuid",
    "event_type": "children_show",
    "starts_at": "2026-12-01T18:00:00Z",
    "venue_name": null,
    "venue_address": "...",
    "district": null,
    "city": null,
    "guest_count": null
  }
}
```

Reglas:

- El snapshot se genera con los valores vigentes al confirmar y no se modifica después.
- `template.version` se usa en `contract_documents.template_version` cuando Feature 005 genere el PDF.
- `brand` conserva los datos de contacto y las rutas de logo/firma; la ausencia de logo o firma no bloquea la confirmación, pero sí puede bloquear la generación del PDF.
- El snapshot no incluye tokens, URLs firmadas ni secretos.

## 8. Numeración transaccional

Procedimiento interno de `confirm_contract`:

1. Bloquear el contrato y validar propietario, estado `draft` y `version`.
2. Validar plantilla activa y fila de marca.
3. Construir el snapshot.
4. Insertar la fila del contador si no existe:

   ```sql
   insert into public.contract_counters (owner_id, series, next_value)
   values (v_owner_id, 'default', 1)
   on conflict (owner_id, series) do nothing;
   ```

5. Leer y bloquear el contador:

   ```sql
   select next_value
   into v_next_value
   from public.contract_counters
   where owner_id = v_owner_id and series = 'default'
   for update;
   ```

6. Si `v_next_value > 99999`, lanzar `contract_number_exhausted`.
7. Actualizar el contador a `v_next_value + 1`.
8. Asignar `contract_number = v_next_value`, `template_snapshot`, `confirmed_at`, `status = 'pending_signature'` y `version = version + 1`.

La transacción completa garantiza que un rollback no consuma el número.

## 9. Pagos

- `record_contract_payment` valida sesión, propietario y estado permitido.
- Bloquea el contrato con `FOR UPDATE` y comprueba que el contrato siga en un estado que acepte pagos.
- El trigger `enforce_payment_total` sigue validando que `sum(amount_cents) + nuevo_pago <= total_amount_cents`.
- `amount_cents` debe ser `> 0`; `kind` y `method` deben ser valores válidos del enum.
- `paid_at` se puede enviar para registrar un pago histórico; por defecto es `now()`.
- La respuesta devuelve la fila insertada y el trigger `audit_payment_change` registra `payment.recorded`.
- No se implementan actualización ni borrado de pagos; siguen bloqueados por triggers.
- Se revoca el `INSERT` directo de `authenticated` sobre `contract_payments`; la policy de inserción existente se elimina para evitar una vía alternativa sin validación de estado.

## 10. Auditoría semántica

Se reemplaza la función `audit_contract_change()` en una migración nueva (no se edita la migración aplicada). El nuevo formato de `changes` debe incluir:

```json
{
  "before": {
    "status": "draft",
    "version": 1,
    "contract_number": null,
    "confirmed_at": null,
    "signed_at": null,
    "signed_by_name": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "supersedes_contract_id": null
  },
  "after": {
    "status": "pending_signature",
    "version": 2,
    "contract_number": 1,
    "confirmed_at": "2026-11-05T12:00:00Z",
    "signed_at": null,
    "signed_by_name": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "supersedes_contract_id": null
  }
}
```

- En `INSERT` sin `supersedes_contract_id`: `contract.created`.
- En `INSERT` con `supersedes_contract_id`: `contract.replacement_created`.
- En `UPDATE` con cambio de estado: acción según el estado nuevo.
- En `UPDATE` sin cambio de estado: `contract.updated`.
- Las RPC no insertan auditoría de contrato por su cuenta; el trigger evita duplicados.
- `record_contract_payment` mantiene la auditoría de `payment.recorded` existente.

## 11. RLS, permisos y seguridad

- `revoke execute on function ... from public, anon;`
- `grant execute on function ... to authenticated;`
- Las funciones internas de snapshot y numeración no se exponen a `authenticated`.
- `contract_counters` sigue sin `SELECT`/`INSERT`/`UPDATE`/`DELETE` para `authenticated`.
- Se mantiene la política de `SELECT` de `contract_payments` y se elimina la de `INSERT` directo.
- `contract_overview` se otorga solo a `authenticated`; `anon` no tiene acceso.
- Las RPC verifican `auth.uid()` y `owner_id`; no confían en el `owner_id` enviado por el cliente.
- Los errores no incluyen PII, tokens ni rutas de Storage.
- `service_role` no aparece en el cliente, en `.env.local` ni en variables `EXPO_PUBLIC_*`.

## 12. Estructura de archivos

```text
supabase/
  migrations/
    20261103000100_enums_and_helpers.sql          # existente
    20261103000200_core_tables.sql                # existente
    20261103000300_contract_tables.sql            # existente
    20261103000400_integrity_functions.sql        # existente
    20261103000500_rls_policies.sql               # existente
    20261103000600_storage_bucket.sql             # existente
    20261103000700_contract_operations.sql        # nueva
    20261103000800_contract_read_model.sql        # nueva
  tests/
    001_rls.test.sql                              # existente
    002_constraints.test.sql                      # existente
    003_audit_and_payments.test.sql               # existente
    004_storage_and_edge_cases.test.sql           # existente
    005_contract_operations.test.sql              # nueva
    006_contract_read_model.test.sql              # nueva
features/
  contracts/
    contract-service.ts
    contract-errors.ts
    contract-schemas.ts
types/
  database.ts                                     # regenerado
context/
  feature-specs/
    003-operaciones-transaccionales-contratos.md
  progress-tracker.md
```

## 13. Pruebas

### 13.1 pgTAP `005_contract_operations.test.sql`

1. Confirmar un borrador asigna secuencialmente `1`, `2`, `3`, cambia a `pending_signature`, incrementa `version` y registra `contract_number`, `template_snapshot` y `confirmed_at`.
2. Confirmar con `version` incorrecta falla con `contract_version_mismatch`.
3. Confirmar un contrato que no está en `draft` falla con `contract_invalid_transition`.
4. Confirmar sin plantilla activa falla con `contract_template_unavailable`.
5. Confirmar sin `brand_settings` falla con `contract_brand_unavailable`.
6. Confirmar con `description` vacía o total `0` falla con `contract_incomplete`.
7. Un rollback dentro de una transacción no consume el número; el siguiente contrato recibe el número esperado.
8. Al llegar a `99999`, el siguiente intento falla con `contract_number_exhausted` y no incrementa el contador.
9. Firmar un contrato `pending_signature` cambia a `signed`, guarda nombre/fecha y audita `contract.signed`.
10. Firmar un contrato `draft` o `signed` falla.
11. Cancelar un `draft` y un `pending_signature` cambia a `cancelled`, guarda motivo/fecha y conserva el número cuando existía.
12. Anular un `signed` con reemplazo crea el `draft` enlazado, copia los campos comerciales y deja ambos cambios en la misma transacción.
13. Anular un contrato no firmado falla.
14. Archivar `signed`, `cancelled` y `annulled` funciona; archivar `draft` falla.
15. Registrar un pago válido inserta la fila, actualiza el saldo derivado y audita `payment.recorded`.
16. Un pago que supera el total falla con `payment_exceeds_total`.
17. Un pago en estado `cancelled`, `annulled` o `archived` falla con `payment_state_not_allowed`.
18. Un pago con importe `<= 0` falla con `invalid_input`.
19. Un usuario autenticado distinto no puede confirmar, firmar, cancelar, anular, archivar ni registrar pagos del propietario.
20. `anon` no puede ejecutar ninguna RPC.
21. `authenticated` no puede insertar directamente en `contract_payments`.
22. `contract_counters` sigue inaccesible para `authenticated`.

### 13.2 pgTAP `006_contract_read_model.test.sql`

1. `contract_overview` devuelve el contrato propio con cliente, evento, total, pagado y saldo.
2. `contract_overview` respeta RLS y no devuelve contratos de otro propietario.
3. `anon` no puede leer `contract_overview`.
4. Los filtros por número, estado y cliente devuelven el contrato esperado.
5. Un contrato sin pagos devuelve `paid_amount_cents = 0` y `balance_cents = total_amount_cents`.

### 13.3 Verificación de la app

- `features/contracts/contract-service.ts` compila contra `types/database.ts`.
- Los schemas Zod validan UUID, versión, importes y textos requeridos.
- La traducción de errores cubre todos los tokens de la tabla de errores.
- `npm run typecheck` y `npm run lint` pasan.
- No hay referencias a `service_role` en `app/`, `features/`, `lib/` ni `.env.local`.

### 13.4 Verificación remota

Con el proyecto vinculado:

```bash
npm run db:push:remote:dry
npm run db:push:remote
npm run db:test:remote
npm run db:types:remote
npm run typecheck
npm run lint
```

- Las pruebas pgTAP usan `begin`/`rollback` y el bloque `extensions.num_failed()`.
- Antes de cargar datos reales, ejecutar las pruebas en un branch o proyecto de pruebas.
- Si aún no existe branch, usar producción solo mientras el proyecto esté vacío y documentarlo.

## 14. Criterios de aceptación

1. Existen las RPC de confirmar, firmar, cancelar, anular con reemplazo, archivar y registrar pago.
2. Confirmar asigna un número secuencial gapless y no reutiliza números cancelados o anulados.
3. La confirmación congela plantilla, marca, cliente, evento e importes en el snapshot.
4. Cada transición valida propietario, estado y `version`; un conflicto no sobrescribe datos.
5. El pago se registra append-only, respeta el total y no se puede insertar directamente desde el cliente.
6. La anulación crea el reemplazo enlazado en la misma transacción.
7. La auditoría registra acciones semánticas sin duplicados.
8. `contract_overview` devuelve los datos de listado/detalle y respeta RLS.
9. `anon` y un segundo usuario autenticado no pueden ejecutar operaciones ni leer datos ajenos.
10. Las 22 aserciones de `005` y las 5 de `006` pasan en remoto.
11. Los tipos generados incluyen las RPC y la vista; `typecheck` y `lint` pasan.
12. `progress-tracker.md` y la documentación afectada quedan actualizados.

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Dos dispositivos confirman el mismo contrato | Bloqueo `FOR UPDATE`, validación de `version` y transición de estado; el segundo recibe conflicto. |
| Dos pagos concurrentes superan el total | El trigger `enforce_payment_total` bloquea la fila del contrato con `FOR UPDATE`. |
| El contador se salta un número por un error | La asignación ocurre dentro de la misma transacción; rollback revierte el incremento. |
| Se agota la serie de 5 dígitos | Validar `next_value <= 99999` antes de actualizar y devolver `contract_number_exhausted`. |
| Se confirma sin snapshot completo | Construir el snapshot en una sola función y probar todos los campos obligatorios. |
| La auditoría se duplica | Las RPC no insertan auditoría de contrato; solo el trigger lo hace. |
| Un cliente inserta pagos saltándose reglas | Revocar `INSERT` directo y centralizar en `record_contract_payment`. |
| Un reemplazo queda huérfano | Anular y crear el reemplazo en la misma transacción; probar rollback. |
| La vista filtra datos ajenos | `security_invoker = true`, RLS base y prueba con segundo usuario/anon. |
| Los errores internos llegan al usuario | Tokens estables + traducción en `contract-errors.ts`; no mostrar mensajes SQL crudos. |

## 16. Observabilidad

- Sin analytics en el MVP.
- Los errores de RPC se registran en Supabase con códigos, sin PII ni tokens.
- La auditoría de negocio vive en `contract_audit_log`; no sustituye logs de infraestructura.
- Las pruebas pgTAP se ejecutan antes de cada cambio de esquema o RPC.
- No se registran nombres completos, teléfonos, direcciones exactas ni URLs firmadas en logs de la app.

## 17. Definición de terminado

- Migraciones nuevas aplicadas y verificadas en remoto.
- RPC y vista probadas con `anon`, propietario y segundo usuario.
- Numeración, snapshot, pagos, anulación con reemplazo y auditoría probados.
- `features/contracts` con servicio tipado, schemas y errores traducidos.
- `types/database.ts` regenerado y sin BOM.
- `npm run typecheck` y `npm run lint` pasan.
- `progress-tracker.md` actualizado con resultados y pendientes.
- Documentación de Feature 002 actualizada si la revocación de `INSERT` de pagos cambia su matriz de RLS.

## 18. Checklist de implementación

- [x] Crear migración `20261103000700_contract_operations.sql`.
- [x] Implementar helper de snapshot y numeración.
- [x] Implementar `confirm_contract`.
- [x] Implementar `sign_contract`.
- [x] Implementar `cancel_contract`.
- [x] Implementar `annul_and_replace_contract`.
- [x] Implementar `archive_contract`.
- [x] Implementar `record_contract_payment`.
- [x] Reemplazar `audit_contract_change()` sin editar migraciones aplicadas.
- [x] Crear migración `20261103000800_contract_read_model.sql`.
- [x] Crear vista `contract_overview`.
- [x] Revocar `INSERT` directo de `contract_payments` y ajustar policies.
- [x] Otorgar/revocar permisos de ejecución de RPC y `SELECT` de la vista.
- [x] Crear `features/contracts/contract-service.ts`.
- [x] Crear `features/contracts/contract-errors.ts`.
- [x] Crear `features/contracts/contract-schemas.ts`.
- [x] Escribir `005_contract_operations.test.sql`.
- [x] Escribir `006_contract_read_model.test.sql`.
- [x] Ejecutar migraciones, pruebas y regenerar tipos en remoto.
- [x] Ejecutar `npm run typecheck` y `npm run lint`.
- [x] Actualizar `progress-tracker.md` y Feature 002 si corresponde.

## 19. Siguiente feature

Feature 004: UI de contratos — listado y búsqueda con `contract_overview`, formulario de borrador, detalle, historial de auditoría y acciones de confirmar, firmar, cancelar, anular/reemplazar, archivar y registrar pagos usando el servicio de esta feature.
