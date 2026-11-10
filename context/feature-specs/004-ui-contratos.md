# Feature Spec 004 — UI de contratos

## Metadata

| Campo      | Valor                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| ID         | 004                                                                                            |
| Estado     | Implementada y verificada en Android                                                           |
| Fase       | 4 — Operaciones de contratos                                                                   |
| Depende de | Feature 003: operaciones transaccionales y modelo de lectura                                   |
| Habilita   | Feature 005: PDF, Edge Function y entrega del documento                                        |
| Fecha      | 2026-11-05                                                                                     |
| Contexto   | `project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, Feature 003    |

## 1. Problema

Las operaciones de contrato ya existen en Supabase y en `features/contracts`, pero la app solo muestra pantallas placeholder. La responsable no puede crear un borrador, encontrar contratos, revisar el detalle, registrar pagos ni ejecutar las transiciones de estado desde el teléfono. Mientras no exista esta interfaz, las RPC y la vista `contract_overview` no aportan valor operativo.

## 2. Objetivo

Implementar la primera versión completa de la UI de contratos:

- listado con búsqueda y filtros sobre `contract_overview`;
- formulario guiado para crear y editar borradores;
- detalle con cliente, evento, importes, pagos e historial;
- acciones de confirmar, firmar, cancelar, anular/reemplazar, archivar y registrar pagos;
- estados de carga, vacío, error y reintento en todas las vistas dependientes de red.

Esta feature no genera PDF ni crea documentos. Consume el servicio y las RPC de Feature 003.

## 3. Alcance

### Incluye

- Servicio de lectura tipado para `contract_overview`, pagos y auditoría.
- Servicio de clientes y catálogo de paquetes para el formulario.
- Servicio de borradores: crear, editar y eliminar sin salir de RLS.
- Hook de consultas y mutaciones con TanStack Query, invalidación por contrato y por listado.
- Formateadores centralizados de moneda PEN, fechas `America/Lima` y teléfonos.
- Componentes de UI reutilizables: campo de texto, hoja modal, chips de opción, tarjeta de sección, banner de error y estado vacío/error.
- Pantalla de listado con búsqueda por número, cliente, teléfono o descripción; filtro por estado; opción de incluir archivados.
- Pantalla de detalle con todas las secciones y acciones permitidas según el estado.
- Formulario de borrador con secciones de cliente, evento, paquete, importes y notas.
- Historial de auditoría traducido a etiquetas legibles.
- Registro de pagos desde el detalle con validación de importe, tipo y método.
- Actualización de `progress-tracker.md` y de la documentación afectada.

### No incluye

- Generación, descarga o compartición de PDF; Feature 005.
- Edición de plantillas, catálogo o datos de marca desde Ajustes.
- Firma gráfica del cliente; se registra nombre y fecha.
- Notificaciones, recordatorios, calendario o exportaciones.
- Cambios de esquema, migraciones o nuevas RPC. El borrador se escribe con las políticas RLS existentes.
- Pruebas E2E automatizadas; la verificación es typecheck, lint y recorrido manual en Android.
- Modo offline.

## 4. Decisiones aplicadas

### 4.1 Navegación

- `Contratos` y `Crear` siguen siendo pestañas inferiores.
- El detalle vive en `app/contracts/[id]/index.tsx` y la edición de borrador en `app/contracts/[id]/edit.tsx`.
- Ambas rutas se registran dentro de `Stack.Protected` para exigir sesión.
- La pestaña `Crear` siempre inicia un borrador nuevo; editar un borrador no reutiliza esa pestaña.
- Al guardar un borrador nuevo se navega al detalle con `router.replace`; al guardar una edición se vuelve al detalle con `router.back`.

### 4.2 Estado remoto

- Se incorpora `@tanstack/react-query` como administrador de estado remoto, según `architecture.md`.
- El `QueryClient` se crea una sola vez en `lib/query-client.ts` y se provee en `app/_layout.tsx`.
- Las consultas usan `staleTime` corto; después de una mutación se invalidan listado, detalle, pagos, auditoría y borrador afectados.
- Los componentes no llaman a Supabase directamente; consumen hooks de `features/contracts`.
- El estado local de búsqueda, filtros y modales vive en los componentes, no en Zustand.

### 4.3 Listado

- La fuente es `contract_overview`.
- Por defecto se ocultan los contratos `archived`; la usuaria puede verlos con un filtro explícito.
- La búsqueda se aplica a cliente, teléfono, descripción y número de contrato (cuando la entrada es numérica).
- La entrada de búsqueda se sanea para no romper la sintaxis de filtros de PostgREST.
- Orden por `created_at` descendente y límite inicial de 50 registros.
- Los estados siempre se muestran con texto además del color.
- Cada tarjeta muestra número o “Sin número”, cliente, fecha del evento, tipo de evento, descripción breve, total y saldo.

### 4.4 Detalle

- Se consulta `contract_overview` por `contract_id`.
- Se muestran: estado, número, descripción, cliente/teléfono, evento, importes, movilidad, notas y fechas relevantes.
- Los pagos y la auditoría se consultan por separado y se muestran debajo.
- Mientras el detalle carga se muestra un estado de carga; si no existe o falla se muestra error con reintento y opción de volver.
- Si el contrato cambió en otro dispositivo, las mutaciones devuelven conflicto de versión y la pantalla invalida las consultas.
- Las acciones se muestran solo si el estado las permite:

| Estado                                      | Acciones                                                        |
| ------------------------------------------- | --------------------------------------------------------------- |
| `draft`                                     | Editar, confirmar, cancelar, registrar pago, eliminar borrador  |
| `pending_signature`                         | Firmar, cancelar, registrar pago                                 |
| `signed`                                    | Registrar pago, anular y reemplazar, archivar                    |
| `cancelled` / `annulled`                    | Archivar                                                         |
| `archived`                                  | Solo lectura                                                     |

- Confirmar, archivar y eliminar borrador piden confirmación con `Alert`.
- Firmar pide el nombre de quien firma.
- Cancelar y anular piden un motivo obligatorio.
- Registrar pago pide importe, tipo (`deposit`/`balance`), método, fecha y nota opcional.
- La anulación usa el mismo evento del contrato original; el reemplazo se abre al terminar la operación.

### 4.5 Formulario de borrador

- Se implementa con React Hook Form + Zod, igual que el flujo de autenticación.
- Secciones: cliente, evento, paquete/descripción, importes y notas.
- Permite reutilizar un cliente existente por nombre o teléfono. Si la usuaria selecciona uno y no cambia sus datos, se usa su `client_id`; si cambia nombre o teléfono, se crea un cliente nuevo para no alterar contratos históricos.
- En edición se actualiza el cliente y el evento del borrador actual.
- La fecha y la hora se eligen con selectores nativos; el valor `AAAA-MM-DD HH:mm` se completa solo (hora por defecto 18:00, fecha por defecto hoy) y se interpreta siempre en `America/Lima` (`-05:00`).
- El teléfono se captura con formato visual `999 999 999`, se limita a 9 dígitos y se normaliza a E.164 con prefijo `+51`; cualquier otra cantidad de dígitos es inválida.
- El total y la movilidad se ingresan en soles y se convierten a céntimos. La movilidad no puede superar el total.
- El paquete del catálogo es opcional y solo precarga descripción y precio; ambos quedan editables.
- Guardar un borrador no consume número ni confirma el contrato.
- Si la creación falla después de insertar cliente o evento, se intenta limpiar lo insertado y se muestra el error real.
- La edición intenta restaurar cliente y evento si falla la actualización del contrato.
- Eliminar un borrador con pagos o documentos falla por RLS y se muestra el mensaje del servidor.

### 4.6 Pagos e historial

- Los pagos se leen de `contract_payments` ordenados por `paid_at` descendente.
- La suma pagada y el saldo vienen de `contract_overview`; no se recalculan en la app.
- Registrar un pago usa `record_contract_payment`; la UI no inserta directamente.
- Tras registrar un pago se invalidan detalle, pagos, auditoría y listado.
- La auditoría se lee de `contract_audit_log` y traduce acciones (`contract.confirmed`, `payment.recorded`, etc.) a etiquetas en español.
- Las notas internas no se muestran en la previsualización del documento futuro, pero sí en el detalle operativo.

### 4.7 Formato y zona horaria

- Moneda en PEN con `Intl.NumberFormat('es-PE')`.
- Fechas con `Intl.DateTimeFormat('es-PE')` y `timeZone: 'America/Lima'`.
- Los importes se guardan y comparan en céntimos; solo se convierten a texto en la capa de presentación.
- El teléfono se muestra en formato legible y se usa `tel:` para llamar desde el detalle.

### 4.8 Errores y estados

- Errores de RPC se traducen con `toContractOperationError`; nunca se muestran mensajes SQL crudos.
- Errores de PostgREST comunes (`23514`, `23503`, `23505`, `PGRST116`) se traducen a mensajes de producto.
- Cada vista de red muestra carga, vacío, error y reintento.
- Los formularios muestran el error del campo y un banner con el error de servidor.
- Los botones se deshabilitan mientras una mutación está en curso.

## 5. Historias de usuario

1. Como responsable, quiero ver mis contratos recientes y buscarlos por cliente, teléfono, número o descripción.
2. Como responsable, quiero filtrar por estado y decidir si veo los archivados.
3. Como responsable, quiero crear un borrador completo desde el teléfono reutilizando un cliente existente.
4. Como responsable, quiero editar un borrador sin perder datos ni confirmar accidentalmente.
5. Como responsable, quiero ver en el detalle el estado, cliente, evento, importes, pagos e historial en un solo lugar.
6. Como responsable, quiero confirmar un borrador para asignarle número y dejarlo listo para firma.
7. Como responsable, quiero registrar el adelanto y los abonos sin superar el total.
8. Como responsable, quiero firmar, cancelar, anular con reemplazo o archivar según corresponda.
9. Como responsable, quiero recibir un mensaje claro si otro dispositivo modificó el contrato.
10. Como desarrollador, quiero que la UI no tenga lógica de Supabase y que todas las mutaciones usen los casos de uso existentes.

## 6. Contratos de datos

### 6.1 Lecturas

| Función                         | Fuente                                       | Uso                          |
| ------------------------------- | -------------------------------------------- | ---------------------------- |
| `listContracts(filters)`        | `contract_overview`                          | Listado y búsqueda           |
| `getContractOverview(id)`       | `contract_overview`                          | Detalle                      |
| `listContractPayments(id)`      | `contract_payments`                          | Historial de pagos           |
| `listContractAudit(id)`         | `contract_audit_log`                         | Historial de cambios         |
| `getDraftDetails(id)`           | `contracts` + `clients` + `events`           | Edición de borrador          |
| `listClients(search?)`          | `clients`                                    | Reutilizar cliente           |
| `listServiceCatalog()`          | `service_catalog` (activos)                  | Paquetes del formulario      |

### 6.2 Escrituras de borrador

- `createDraft(input)` inserta cliente (si corresponde), evento y contrato `draft`.
- `updateDraft({ contractId, expectedVersion, ...input })` actualiza cliente, evento y contrato con bloqueo optimista.
- `deleteDraft({ contractId })` elimina el contrato solo si sigue en `draft` y sin pagos/documentos.
- Las mutaciones de estado y pagos usan exclusivamente `features/contracts/contract-service.ts` de Feature 003.

### 6.3 Validaciones del formulario

| Campo             | Regla                                                        |
| ----------------- | ------------------------------------------------------------ |
| Nombre cliente    | 2 a 160 caracteres                                           |
| Teléfono          | Normalizable a E.164 peruano o internacional                 |
| Tipo de evento    | `children_show`, `private_show`, `hora_loca`, `other`        |
| Fecha y hora      | `AAAA-MM-DD HH:mm`, válida en `America/Lima`                 |
| Dirección         | 5 a 300 caracteres                                           |
| Asistentes        | Entero positivo opcional                                     |
| Descripción       | 1 a 2000 caracteres                                          |
| Total             | Mayor que cero, en soles                                     |
| Movilidad         | Mayor o igual a cero y menor o igual al total                |
| Notas             | Longitud acotada y opcional                                  |

## 7. Rutas y estructura de archivos

```text
app/
  _layout.tsx                                  # QueryClientProvider y rutas de contratos protegidas
  (tabs)/
    contracts.tsx                              # listado
    create.tsx                                 # nuevo borrador
  contracts/
    [id]/
      index.tsx                                # detalle
      edit.tsx                                 # edición de borrador
components/ui/
  error-banner.tsx
  modal-sheet.tsx
  option-chips.tsx
  screen-header.tsx
  section-card.tsx
  state-view.tsx
  text-field.tsx
features/contracts/
  contract-labels.ts
  contract-schemas.ts                          # se amplía con filtros y formulario
  contract-service.ts                          # se amplía con lecturas y borradores
  contract-types.ts
  use-contract-queries.ts
  components/
    contract-card.tsx
    contract-filters.tsx
    contract-status-pill.tsx
    contract-summary.tsx
    payment-form.tsx
    payment-list.tsx
    audit-history.tsx
    draft-form.tsx
features/clients/
  client-service.ts
features/catalog/
  catalog-service.ts
lib/
  format.ts
  query-client.ts
  use-debounced-value.ts
context/
  feature-specs/
    004-ui-contratos.md
  progress-tracker.md
```

## 8. Verificación

### 8.1 Automática

```bash
npm run typecheck
npm run lint
npm run export:android
```

- `typecheck` valida hooks, formularios, rutas tipadas y tipos generados de Supabase.
- `lint` no debe reportar errores nuevos.
- `export:android` confirma que el bundle de Expo resuelve todas las rutas y dependencias.

### 8.2 Manual en Android

1. Iniciar sesión y abrir `Contratos`: se ve el estado vacío si no hay datos.
2. Crear un borrador con un cliente nuevo y un paquete; se abre el detalle sin número.
3. Editar el borrador, recargar y verificar que los datos persisten.
4. Registrar un pago y comprobar total, pagado y saldo.
5. Confirmar el contrato; se asigna número y pasa a “Por firmar”.
6. Firmar con nombre; pasa a “Firmado” y el historial registra acciones.
7. Anular y reemplazar; se abre un nuevo borrador enlazado.
8. Archivar el contrato anulado; desaparece de la lista por defecto.
9. Buscar por cliente, teléfono, número y descripción; probar filtros de estado.
10. Simular un error de red y verificar el estado de error con reintento.

## 9. Criterios de aceptación

1. El listado usa `contract_overview`, oculta archivados por defecto y permite buscarlos.
2. La búsqueda filtra por número, cliente, teléfono y descripción sin errores de PostgREST.
3. El formulario crea y edita borradores con validación Zod y normalización de teléfono/fecha.
4. Crear un borrador no consume número ni cambia el estado a confirmado.
5. Las acciones se muestran según el estado y usan las RPC de Feature 003.
6. Un conflicto de versión se muestra como error y fuerza la recarga de datos.
7. Los pagos se registran por RPC y el saldo mostrado viene de la vista.
8. El detalle muestra cliente, evento, importes, pagos e historial.
9. Todas las vistas de red tienen carga, vacío, error y reintento.
10. `typecheck`, `lint` y `export:android` pasan.
11. `progress-tracker.md` queda actualizado.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Búsqueda que rompe filtros de PostgREST | Sanitizar la entrada y usar `or` con columnas controladas. |
| Fechas interpretadas en otra zona | Parsear y formatear siempre con `America/Lima` y `-05:00`. |
| Importes con coma o punto decimal | Parser centralizado y almacenamiento en céntimos. |
| Borrador parcialmente guardado | Compensación best-effort; validar antes de guardar y mostrar el error real. |
| Mutación sobre contrato desactualizado | Enviar `version` y recargar ante conflicto. |
| Acciones no permitidas visibles | Renderizado condicionado por estado y validación del servidor. |
| UI con lógica de Supabase | Servicios y hooks por dominio; pantallas delgadas. |

## 11. Checklist de implementación

- [x] Crear `lib/format.ts`, `lib/query-client.ts` y `lib/use-debounced-value.ts`.
- [x] Crear componentes UI reutilizables.
- [x] Ampliar `contract-errors.ts` y `contract-schemas.ts`.
- [x] Ampliar `contract-service.ts` con lecturas y borradores.
- [x] Crear servicios de clientes y catálogo.
- [x] Crear hooks de TanStack Query.
- [x] Implementar listado y filtros.
- [x] Implementar formulario de borrador y edición.
- [x] Implementar detalle, pagos, historial y acciones.
- [x] Registrar rutas protegidas y proveedor de consultas.
- [x] Ejecutar `typecheck`, `lint` y `export:android`.
- [x] Actualizar `progress-tracker.md`.

## 12. Siguiente feature

Feature 005: generación del PDF desde `template_snapshot`, Edge Function `generate-contract-pdf`, registro en `contract_documents`, descarga por signed URL y compartición por WhatsApp.
