# Feature Spec 002 — Modelo de datos inicial y RLS

## Metadata

| Campo      | Valor                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| ID         | 002                                                                                                     |
| Estado     | Implementada y validada en Supabase remoto; tipos regenerados; pendiente branch de prueba              |
| Fase       | 3 — Modelo de datos y seguridad                                                                         |
| Depende de | Feature 001: acceso de la cuenta propietaria                                                            |
| Habilita   | Feature 003: operaciones transaccionales de contratos, numeración, pagos y consultas                    |
| Fecha      | 2026-11-03                                                                                              |
| Contexto   | `project-overview.md`, `architecture.md`, `code-standards.md`, `contract-template.md`                   |

## 1. Problema

La autenticación de la cuenta propietaria ya existe, pero todavía no hay un esquema de datos que guarde clientes, eventos, catálogo, contratos, pagos, documentos y auditoría. Sin tablas, restricciones y RLS no se pueden proteger los datos del negocio, garantizar los invariantes de `architecture.md` ni generar tipos confiables para la app.

## 2. Objetivo

Crear la base de datos inicial del MVP en Supabase: tablas, enums, relaciones, restricciones, índices, políticas RLS, protección de Storage, triggers de integridad, tipos TypeScript generados y pruebas de acceso denegado. Esta unidad no incluye UI ni las operaciones de negocio que asignan números, confirman contratos o generan documentos.

## 3. Alcance

### Incluye

- Inicialización de `supabase/config.toml`, estructura de migraciones y entorno local/branch de prueba.
- Enums de estado de contrato, tipos de evento, categorías, tipos de pago y métodos de pago.
- Tablas `clients`, `events`, `service_catalog`, `contract_templates`, `contracts`, `contract_payments`, `contract_documents`, `contract_audit_log`, `contract_counters` y `brand_settings`.
- Relaciones, claves foráneas compuestas, restricciones de importes, estados e inmutabilidad.
- Índices de búsqueda y consulta por propietario, cliente, teléfono, fecha y número de contrato.
- RLS con `owner_id = auth.uid()` para todas las tablas de negocio.
- Políticas de Storage para el bucket privado `contract-documents`.
- Vista `contract_financials` para saldo derivado.
- Triggers de `updated_at`, versión optimista, auditoría, inmutabilidad de pagos/plantillas y límite de pagos.
- Seed de referencia de plantilla y catálogo para desarrollo.
- Tipos TypeScript generados en `types/database.ts`.
- Pruebas SQL de RLS, restricciones y triggers.
- Runbook para aplicar migraciones y regenerar tipos sin exponer secretos.

### No incluye

- Pantallas o componentes de contratos, clientes, catálogo, pagos o documentos.
- RPC transaccional de confirmación y asignación de número (`confirm_contract`) ni RPC de pagos; se implementan en Feature 003.
- Generación de PDF, Edge Functions, carga/descarga de documentos o evidencias de firma.
- Edición de plantillas o datos de marca desde Ajustes.
- Descarga, exportación CSV/ZIP, backups o purga automática.
- Multiusuario, roles, invitaciones o registro abierto.
- Docker local obligatorio; se permite un proyecto Supabase local o branch de prueba.

## 4. Decisiones aplicadas

- Los nombres de tablas, columnas, enums y claves internas se escriben en inglés; la UI y los documentos de producto en español.
- Todas las tablas de negocio usan `owner_id uuid not null default auth.uid()` con FK a `auth.users(id)` y RLS `owner_id = auth.uid()`.
- La cuenta propietaria sigue siendo única; el esquema no crea tabla de perfiles ni roles.
- Todos los importes se guardan como enteros en céntimos de PEN (`*_cents`).
- Un contrato pertenece a un cliente y a un evento; una FK compuesta impide cruzar cliente, evento y propietario.
- Los borradores se pueden crear, editar y eliminar directamente. Los contratos confirmados son de solo lectura para el cliente móvil.
- La asignación de número y las transiciones de estado se harán exclusivamente mediante funciones `security definer` en Feature 003; el cliente no accede directamente a `contract_counters`.
- `contract_payments` y `contract_audit_log` son append-only desde el cliente: no se actualizan ni eliminan directamente. La auditoría de un borrador puede eliminarse en cascada cuando se elimina el borrador.
- Las versiones de plantilla son inmutables en su contenido; solo cambia `is_active`.
- `brand_settings` es una fila única global (`id = 1`) para la única cuenta propietaria.
- El bucket `contract-documents` es privado. El cliente solo lee metadatos autorizados; la Edge Function escribe con `service_role`.
- La `service_role` nunca se incluye en la app, en `.env.local` ni en variables `EXPO_PUBLIC_*`.

## 5. Historias de usuario

1. Como responsable, quiero que mis clientes, eventos, contratos y pagos solo sean visibles con mi sesión.
2. Como responsable, quiero reutilizar clientes y eventos sin perder la relación con cada contrato.
3. Como responsable, quiero que un contrato no pueda tener pagos por encima del monto acordado.
4. Como responsable, quiero que un contrato confirmado no pueda modificarse ni eliminarse desde la app.
5. Como responsable, quiero que las plantillas y los snapshots conserven el texto y la marca usados en cada contrato.
6. Como responsable, quiero que la numeración de contratos sea única y no se reutilice.
7. Como desarrollador, quiero tipos TypeScript generados desde el esquema para evitar nombres y columnas inventadas.
8. Como desarrollador, quiero pruebas que demuestren que `anon` y otra cuenta autenticada no pueden leer ni escribir los datos del propietario.

## 6. Flujo de implementación

### Preparación

1. Ejecutar `npx supabase init` si no existe `supabase/config.toml`.
2. Vincular el proyecto remoto con `npx supabase link --project-ref <ref>`.
3. Mantener las migraciones en `supabase/migrations` y las pruebas en `supabase/tests`.
4. Aplicar primero en local o branch de prueba; nunca ejecutar pruebas destructivas contra producción.

### Aplicación

1. Crear enums y helpers.
2. Crear tablas, relaciones, restricciones e índices.
3. Crear triggers de integridad y auditoría.
4. Habilitar RLS y crear políticas por tabla.
5. Crear bucket y políticas de Storage.
6. Ejecutar seed de referencia solo en desarrollo o primera configuración controlada.
7. Regenerar `types/database.ts`.
8. Ejecutar pruebas SQL y `npm run typecheck` / `npm run lint`.

Comandos remotos con el proyecto vinculado:

```bash
npm run db:push:remote
npm run db:seed:remote
npm run db:test:remote
npm run db:types:remote
```

`db:test:remote` usa `supabase db query --file` como fallback cuando `supabase test db` no puede ejecutarse por falta de Docker. No imprime ni versiona la contraseña de la base.

### Uso desde la app

1. La app autenticada consulta clientes, eventos, catálogo y contratos propios.
2. La app solo crea o edita contratos en estado `draft`.
3. Los pagos se consultan; su registro transaccional se implementa en Feature 003.
4. Los contratos confirmados se leen y sus documentos se solicitan a una Edge Function en una feature posterior.
5. La UI nunca usa `service_role` ni escribe en `contract_audit_log` o `contract_counters`.

## 7. Estructura de archivos

```text
supabase/
  config.toml
  migrations/
    20261103000100_enums_and_helpers.sql
    20261103000200_core_tables.sql
    20261103000300_contract_tables.sql
    20261103000400_integrity_functions.sql
    20261103000500_rls_policies.sql
    20261103000600_storage_bucket.sql
  seed.sql
  tests/
    001_rls.test.sql
    002_constraints.test.sql
    003_audit_and_payments.test.sql
    004_storage_and_edge_cases.test.sql
scripts/
  run-remote-db-tests.mjs
types/
  database.ts
```

- Las migraciones son la fuente de verdad del esquema; no se editan una vez aplicadas en un entorno compartido.
- `types/database.ts` se genera con Supabase CLI y no se corrige a mano.
- `seed.sql` contiene datos de referencia, no secretos ni datos personales reales.

## 8. Enums

| Enum               | Valores                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `contract_status`  | `draft`, `pending_signature`, `signed`, `cancelled`, `annulled`, `archived` |
| `payment_kind`     | `deposit`, `balance`                                                     |
| `payment_method`   | `cash`, `yape`, `plin`, `bank_transfer`, `other`                         |
| `service_category` | `classic_themed`, `huntrix`, `sensory_stimulation`, `christmas`, `other` |
| `event_type`       | `children_show`, `private_show`, `hora_loca`, `other`                   |

- La UI traduce estos valores a textos en español; no se guardan etiquetas visibles como claves.
- Agregar un valor nuevo requiere una migración explícita; no se usan strings libres para estados.

## 9. Modelo de datos

### `clients`

| Columna       | Tipo          | Restricciones                                      |
| ------------- | ------------- | -------------------------------------------------- |
| `id`          | `uuid`        | PK, `gen_random_uuid()`                            |
| `owner_id`    | `uuid`        | FK `auth.users(id)`, not null, default `auth.uid()` |
| `full_name`   | `text`        | Not null, longitud recortada 2–160                 |
| `phone_e164`  | `text`        | Not null, `^\+[1-9][0-9]{7,14}$`                   |
| `created_at`  | `timestamptz` | Not null, default `now()`                          |
| `updated_at`  | `timestamptz` | Not null, default `now()`                          |

- `phone_e164` no es único: dos clientes pueden compartir teléfono.
- Índices: `(owner_id)`, `(owner_id, phone_e164)`, `(owner_id, lower(full_name))`.
- `unique (id, owner_id)` para permitir FKs compuestas.

### `events`

| Columna          | Tipo           | Restricciones                                      |
| ---------------- | -------------- | -------------------------------------------------- |
| `id`             | `uuid`         | PK, `gen_random_uuid()`                            |
| `owner_id`       | `uuid`         | FK `auth.users(id)`, not null, default `auth.uid()` |
| `client_id`      | `uuid`         | Not null                                           |
| `event_type`     | `event_type`   | Not null                                           |
| `starts_at`      | `timestamptz`  | Not null                                           |
| `venue_name`     | `text`         | Nullable                                           |
| `venue_address`  | `text`         | Not null, longitud recortada 5–300                 |
| `district`       | `text`         | Nullable                                           |
| `city`           | `text`         | Nullable                                           |
| `guest_count`    | `integer`      | Nullable, `> 0`                                    |
| `notes`          | `text`         | Nullable                                           |
| `created_at`     | `timestamptz`  | Not null, default `now()`                          |
| `updated_at`     | `timestamptz`  | Not null, default `now()`                          |

- FK compuesta `(client_id, owner_id) references clients(id, owner_id)`.
- `unique (id, client_id, owner_id)` para que `contracts` valide cliente, evento y propietario juntos.
- Índices: `(owner_id)`, `(client_id)`, `(owner_id, starts_at)`.
- La zona horaria de presentación es `America/Lima`; se guarda `timestamptz`.

### `service_catalog`

| Columna            | Tipo               | Restricciones                                      |
| ------------------ | ------------------ | -------------------------------------------------- |
| `id`               | `uuid`             | PK, `gen_random_uuid()`                            |
| `owner_id`         | `uuid`             | FK `auth.users(id)`, not null, default `auth.uid()` |
| `category`         | `service_category` | Not null                                           |
| `name`             | `text`             | Not null, 2–120                                    |
| `description`      | `text`             | Not null, default `''`                             |
| `price_cents`      | `integer`          | Not null, `>= 0`                                   |
| `duration_minutes` | `integer`          | Nullable, `> 0`                                    |
| `is_active`        | `boolean`          | Not null, default `true`                           |
| `sort_order`       | `integer`          | Not null, default `0`                              |
| `created_at`       | `timestamptz`      | Not null, default `now()`                          |
| `updated_at`       | `timestamptz`      | Not null, default `now()`                          |

- Índice único `(owner_id, category, lower(name))`.
- Índice `(owner_id, is_active, sort_order)`.
- Desactivar (`is_active = false`) es la forma de retirar un paquete; no se elimina para conservar referencias históricas.
- El precio y la descripción del catálogo se copian al contrato como snapshot en una feature posterior.

### `contract_templates`

| Columna          | Tipo          | Restricciones                                      |
| ---------------- | ------------- | -------------------------------------------------- |
| `id`             | `uuid`        | PK, `gen_random_uuid()`                            |
| `owner_id`       | `uuid`        | FK `auth.users(id)`, not null, default `auth.uid()` |
| `version`        | `integer`     | Not null, `> 0`                                    |
| `conditions`     | `jsonb`       | Not null, array JSON                               |
| `brand_snapshot` | `jsonb`       | Not null, object JSON                              |
| `is_active`      | `boolean`     | Not null, default `false`                          |
| `created_at`     | `timestamptz` | Not null, default `now()`                          |
| `updated_at`     | `timestamptz` | Not null, default `now()`                          |

- `unique (owner_id, version)`.
- `unique (id, owner_id)` para permitir FKs compuestas.
- Índice único parcial `(owner_id) where is_active` para exigir una sola versión activa.
- Trigger de inmutabilidad: no se modifican `version`, `conditions`, `brand_snapshot`, `owner_id` ni `created_at`; solo `is_active` y `updated_at`.
- No se elimina una versión usada por contratos.

### `contract_counters`

| Columna       | Tipo          | Restricciones                                      |
| ------------- | ------------- | -------------------------------------------------- |
| `owner_id`    | `uuid`        | FK `auth.users(id)`, not null                      |
| `series`      | `text`        | Not null, default `'default'`                      |
| `next_value`  | `integer`     | Not null, default `1`, `> 0`                       |
| `created_at`  | `timestamptz` | Not null, default `now()`                          |
| `updated_at`  | `timestamptz` | Not null, default `now()`                          |

- PK `(owner_id, series)`.
- RLS habilitado sin políticas de cliente: solo funciones `security definer` pueden usarla.
- Feature 003 implementará `SELECT ... FOR UPDATE`, asignación gapless y rollback seguro.

### `contracts`

| Columna                 | Tipo              | Restricciones                                      |
| ----------------------- | ----------------- | -------------------------------------------------- |
| `id`                    | `uuid`            | PK, `gen_random_uuid()`                            |
| `owner_id`              | `uuid`            | FK `auth.users(id)`, not null, default `auth.uid()` |
| `client_id`             | `uuid`            | Not null                                           |
| `event_id`              | `uuid`            | Not null                                           |
| `template_id`           | `uuid`            | Nullable, FK compuesta `(template_id, owner_id)`    |
| `contract_number`       | `integer`         | Nullable, `> 0`                                    |
| `status`                | `contract_status` | Not null, default `draft`                          |
| `version`               | `integer`         | Not null, default `1`, `> 0`                       |
| `description`           | `text`            | Not null, default `''`                             |
| `total_amount_cents`    | `integer`         | Not null, default `0`, `>= 0`                      |
| `mobility_amount_cents` | `integer`         | Not null, default `0`, `>= 0`, `<= total`          |
| `client_visible_notes`  | `text`            | Nullable                                           |
| `internal_notes`        | `text`            | Nullable                                           |
| `template_snapshot`     | `jsonb`           | Nullable, object JSON                              |
| `supersedes_contract_id`| `uuid`            | Nullable, FK compuesta `(supersedes_contract_id, owner_id)`, distinto de `id` |
| `signed_by_name`        | `text`            | Nullable                                           |
| `signed_at`             | `timestamptz`     | Nullable                                           |
| `signature_storage_path`| `text`            | Nullable                                           |
| `confirmed_at`          | `timestamptz`     | Nullable                                           |
| `cancelled_at`          | `timestamptz`     | Nullable                                           |
| `cancellation_reason`   | `text`            | Nullable                                           |
| `created_at`            | `timestamptz`     | Not null, default `now()`                          |
| `updated_at`            | `timestamptz`     | Not null, default `now()`                          |

Relaciones y restricciones:

- FK compuesta `(client_id, owner_id) references clients(id, owner_id)`.
- FK compuesta `(event_id, client_id, owner_id) references events(id, client_id, owner_id)`.
- FK compuesta `(template_id, owner_id) references contract_templates(id, owner_id)`.
- FK compuesta `(supersedes_contract_id, owner_id) references contracts(id, owner_id)`.
- `unique (id, owner_id)` para FKs compuestas de pagos, documentos y auditoría.
- `unique (owner_id, contract_number) where contract_number is not null`; el número nunca se reutiliza.
- Índices: `(owner_id, status)`, `(owner_id, created_at desc)`, `(client_id)`, `(event_id)`, `(contract_number)`.
- `contract_number`, `template_snapshot` y `confirmed_at` se asignan juntos: o los tres son `null`, o los tres tienen valor.
- `status = 'draft'` exige que los tres campos de confirmación sean `null`.
- `status in ('pending_signature', 'signed', 'annulled')` exige confirmación completa.
- `status = 'signed'` exige `signed_at` y `signed_by_name`.
- `status in ('cancelled', 'annulled')` exige `cancelled_at` y `cancellation_reason`.
- `status = 'archived'` puede conservar o no confirmación, pero no puede ser un borrador editable.
- Trigger de versión: cada `UPDATE` debe enviar `version = version_anterior + 1`; si no, se rechaza.
- No se modifican `owner_id`, `created_at`, `contract_number`, `confirmed_at`, `template_snapshot`, `signed_at`, `signed_by_name` ni `signature_storage_path` desde el cliente móvil.
- Un contrato firmado conserva sus snapshots y solo puede anularse con motivo y fecha; la anulación y el reemplazo se implementan en una feature posterior.

### `contract_payments`

| Columna        | Tipo             | Restricciones                                      |
| -------------- | ---------------- | -------------------------------------------------- |
| `id`           | `uuid`           | PK, `gen_random_uuid()`                            |
| `owner_id`     | `uuid`           | FK `auth.users(id)`, not null, default `auth.uid()` |
| `contract_id`  | `uuid`           | Not null                                           |
| `amount_cents` | `integer`        | Not null, `> 0`                                    |
| `kind`         | `payment_kind`   | Not null                                           |
| `method`       | `payment_method` | Not null                                           |
| `paid_at`      | `timestamptz`    | Not null, default `now()`                          |
| `note`         | `text`           | Nullable                                           |
| `created_at`   | `timestamptz`    | Not null, default `now()`                          |
| `updated_at`   | `timestamptz`    | Not null, default `now()`                          |

- FK compuesta `(contract_id, owner_id) references contracts(id, owner_id) on delete restrict`.
- Trigger append-only: bloquea `UPDATE` y `DELETE`.
- Trigger de límite: bloquea un pago si la suma de pagos del contrato supera `total_amount_cents`.
- El trigger bloquea la fila del contrato con `FOR UPDATE` para evitar dos pagos concurrentes que superen el total.
- Un trigger equivalente rechaza reducir `contracts.total_amount_cents` por debajo de los pagos ya registrados.
- El "a cuenta" y el saldo se derivan; no existen columnas mutables para esos importes en `contracts`.

### `contract_documents`

| Columna           | Tipo          | Restricciones                                      |
| ----------------- | ------------- | -------------------------------------------------- |
| `id`              | `uuid`        | PK, `gen_random_uuid()`                            |
| `owner_id`        | `uuid`        | FK `auth.users(id)`, not null, default `auth.uid()` |
| `contract_id`     | `uuid`        | Not null                                           |
| `storage_path`    | `text`        | Not null, único por contrato/versión               |
| `sha256`          | `text`        | Not null, 64 hex                                    |
| `template_version`| `integer`     | Not null, `> 0`                                    |
| `generated_at`    | `timestamptz` | Not null, default `now()`                          |
| `created_at`      | `timestamptz` | Not null, default `now()`                          |
| `updated_at`      | `timestamptz` | Not null, default `now()`                          |

- FK compuesta `(contract_id, owner_id) references contracts(id, owner_id) on delete restrict`.
- `unique (contract_id, template_version)` para un documento vigente por versión.
- El cliente no inserta ni modifica metadatos; la Edge Function usa `service_role` en una feature posterior.

### `contract_audit_log`

| Columna       | Tipo          | Restricciones                                      |
| ------------- | ------------- | -------------------------------------------------- |
| `id`          | `bigint`      | PK, `generated always as identity`                 |
| `owner_id`    | `uuid`        | FK `auth.users(id)`, not null, default `auth.uid()` |
| `contract_id` | `uuid`        | Not null, FK compuesta `(contract_id, owner_id)` con `on delete cascade` |
| `action`      | `text`        | Not null                                           |
| `changes`     | `jsonb`       | Not null, default `'{}'`, object JSON              |
| `created_at`  | `timestamptz` | Not null, default `now()`                          |

- Append-only: sin `UPDATE` ni `DELETE` para el cliente.
- Índice `(contract_id, created_at desc)`.
- Acciones iniciales: `contract.created`, `contract.updated`, `contract.confirmed`, `contract.signed`, `contract.cancelled`, `contract.annulled`, `contract.archived`, `payment.recorded`, `document.generated`.
- `changes` guarda solo las columnas relevantes modificadas, nunca tokens ni secretos.
- La escritura la realiza un trigger `security definer`; el cliente solo puede leer sus entradas.

### `brand_settings`

| Columna                 | Tipo          | Restricciones                                      |
| ----------------------- | ------------- | -------------------------------------------------- |
| `id`                    | `smallint`    | PK, `check (id = 1)`                               |
| `owner_id`              | `uuid`        | FK `auth.users(id)`, not null, único               |
| `business_name`         | `text`        | Not null, default `'Anggely Kids Shows y Eventos'` |
| `phone`                 | `text`        | Not null, no vacío                                 |
| `whatsapp`              | `text`        | Not null, no vacío                                 |
| `social_links`          | `jsonb`       | Not null, default `'{}'`, object JSON              |
| `logo_storage_path`     | `text`        | Nullable                                           |
| `signature_storage_path`| `text`        | Nullable                                           |
| `created_at`            | `timestamptz` | Not null, default `now()`                          |
| `updated_at`            | `timestamptz` | Not null, default `now()`                          |

- Fila única global para la única cuenta propietaria.
- Los campos de marca se copian a `template_snapshot.brand_snapshot` al confirmar un contrato.
- No se elimina la fila; se actualiza.

## 10. Vista de estado financiero

`contract_financials` expone:

| Columna              | Cálculo                                                        |
| -------------------- | -------------------------------------------------------------- |
| `contract_id`        | `contracts.id`                                                 |
| `owner_id`           | `contracts.owner_id`                                           |
| `total_amount_cents` | `contracts.total_amount_cents`                                 |
| `paid_amount_cents`  | `coalesce(sum(contract_payments.amount_cents), 0)`             |
| `balance_cents`      | `total_amount_cents - paid_amount_cents`                       |

- La vista usa `security_invoker = true` para heredar RLS de `contracts` y `contract_payments`.
- Solo se concede `select` a `authenticated`; `anon` no tiene acceso.
- El saldo nunca se almacena ni se edita directamente.

## 11. Funciones y triggers de integridad

| Objeto                              | Responsabilidad                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `set_updated_at()`                  | Actualiza `updated_at` en cada `UPDATE` de tablas mutables.                     |
| `enforce_contract_version()`        | Rechaza un `UPDATE` sin `version = old.version + 1` y protege columnas inmutables. |
| `enforce_contract_amounts()`        | Evita reducir el total por debajo de los pagos y mantiene movilidad ≤ total.     |
| `enforce_payment_total()`           | Bloquea pagos que superen el total y serializa inserciones por contrato.         |
| `prevent_mutation()`                | Bloquea `UPDATE`/`DELETE` en `contract_payments`; bloquea `UPDATE` en `contract_audit_log`. El `DELETE` directo de auditoría se deniega por RLS, pero se permite el borrado en cascada de un borrador. |
| `enforce_template_immutability()`   | Solo permite cambiar `is_active` y `updated_at` en plantillas.                  |
| `audit_contract_change()`           | Inserta entradas en `contract_audit_log` para altas, cambios y pagos relevantes. |
| `prevent_delete()`                  | Impide eliminar plantillas, documentos y pagos. La auditoría se protege por RLS y cascada. |
| `contract_financials`               | Vista derivada de pagos y saldo.                                                |

- Las funciones de trigger usan `security definer` con `search_path = public, pg_temp` cuando necesitan escribir auditoría o bloquear filas.
- `contract_counters` no tiene función pública en esta feature; Feature 003 implementará la asignación de números.

## 12. RLS

### Matriz de acceso del cliente autenticado

| Tabla                  | SELECT            | INSERT                              | UPDATE                              | DELETE                              |
| ---------------------- | ----------------- | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| `clients`              | Propio            | Propio                              | Propio                              | Propio, si no tiene contratos       |
| `events`               | Propio            | Propio                              | Propio                              | Propio, si no tiene contratos       |
| `service_catalog`      | Propio            | Propio                              | Propio                              | Denegado                            |
| `contract_templates`   | Propio            | Propio                              | Solo `is_active`/`updated_at`       | Denegado                            |
| `contracts`            | Propio            | Solo `draft`, sin confirmación      | Solo `draft`, sin confirmación      | Solo `draft`, sin pagos ni documentos |
| `contract_payments`    | Propio            | Propio, con contrato propio         | Denegado                            | Denegado                            |
| `contract_documents`   | Propio            | Denegado al cliente                 | Denegado                            | Denegado                            |
| `contract_audit_log`   | Propio            | Denegado al cliente                 | Denegado                            | Denegado                            |
| `contract_counters`    | Denegado          | Denegado                            | Denegado                            | Denegado                            |
| `brand_settings`       | Propio            | Propio, solo `id = 1`               | Propio                              | Denegado                            |
| `contract_financials`  | Propio            | —                                   | —                                   | —                                   |

### Reglas comunes

- Todas las tablas tienen `alter table ... enable row level security`.
- Se revoca todo a `anon`; solo `authenticated` recibe los privilegios necesarios.
- Las políticas usan `(select auth.uid()) = owner_id` para evitar reevaluar `auth.uid()` por fila.
- Los `INSERT` usan `with check` para impedir que un usuario inserte filas con `owner_id` distinto.
- Las FKs compuestas impiden asociar un cliente o evento de otro propietario.
- `contracts` solo acepta escrituras directas en estado `draft`; confirmar, firmar, cancelar, anular o archivar requerirá RPC en Feature 003.
- `contract_payments` permite insertar un pago si el contrato pertenece al usuario; las reglas de estado y numeración se aplican en la RPC de Feature 003.
- Las filas confirmadas son de solo lectura para el cliente móvil, incluso si el usuario es el propietario.
- El `service_role` no se usa en la app; solo en migraciones, seed controlado y Edge Functions.

## 13. Storage

- Bucket privado: `contract-documents`.
- Ruta: `contract_id/template_version/archivo.pdf`.
- El primer segmento de la ruta debe ser un UUID de un contrato cuyo `owner_id = auth.uid()`.
- Política de `SELECT`: el propietario autenticado puede leer objetos de sus contratos.
- Políticas de `INSERT`, `UPDATE` y `DELETE`: sin acceso para el cliente; la Edge Function escribe con `service_role`.
- La entrega al usuario se hará con signed URLs de corta duración en una feature posterior.
- No se crean buckets públicos ni rutas con datos personales.

## 14. Seed de referencia

`supabase/seed.sql` se ejecuta solo en desarrollo o primera configuración controlada. Requiere un `owner_id` real obtenido del dashboard, nunca hardcodeado en el repositorio.

Contenido:

- `brand_settings`: no se inserta con datos inventados. Se configura manualmente desde Ajustes o con un script local que reciba teléfono, WhatsApp y redes reales.
- `contract_templates`: versión 1 con las tres condiciones literales de `contract-template.md` en `conditions`, `is_active = true` y `brand_snapshot` vacío hasta que Ajustes configure la marca.
- `service_catalog`: paquetes de referencia de la página pública (Básico, Mi Fiesta, Super Fiesta, Mega Fiesta, Fiesta Premium, Mega Fiesta Premium) como datos editables de desarrollo.
- No se insertan contratos, clientes ni pagos de ejemplo con PII.

Los precios del seed son solo referencia. La responsable puede modificarlos o desactivarlos; los contratos existentes conservan su snapshot.

## 15. Tipos TypeScript

Después de aplicar migraciones:

```bash
# Con el proyecto vinculado
npm run db:types:remote

# O indicando el proyecto explícitamente
npx supabase gen types typescript --project-id <project-ref> --schema public > types/database.ts
```

- `types/database.ts` se versiona y no se edita a mano.
- Verificar que el archivo generado sea UTF-8 sin BOM; si se genera desde PowerShell, escribir con `UTF8Encoding(false)`.
- `lib/supabase.ts` se tipa como `createClient<Database>(...)`.
- Los enums de TypeScript se derivan de `Database['public']['Enums']`; no se duplican strings en la UI.
- Si el esquema cambia, se regenera el archivo y se ejecuta `npm run typecheck`.

## 16. Validaciones y restricciones

- Importes en céntimos: `>= 0`; pagos `> 0`.
- `mobility_amount_cents <= total_amount_cents`.
- La suma de pagos nunca supera `total_amount_cents`.
- No se puede reducir el total por debajo de la suma de pagos existentes.
- `phone_e164` cumple el patrón E.164; no es único.
- `venue_address` y nombres tienen longitudes mínimas para evitar registros vacíos.
- Una plantilla solo puede tener una versión activa por propietario.
- Un contrato confirmado tiene número, snapshot y `confirmed_at`; un borrador no.
- Un contrato firmado tiene nombre y fecha de firma.
- Una cancelación o anulación tiene motivo y fecha.
- Un pago o entrada de auditoría no se actualiza ni se elimina.
- Un documento tiene SHA-256 hexadecimal de 64 caracteres.
- `contract_number` es único por propietario y nunca se reutiliza, incluso si el contrato se cancela o archiva.

## 17. Pruebas

### Pruebas SQL con pgTAP

Ejecutar con `npx supabase test db` contra local o branch de prueba. En este entorno no hay Docker, así que el fallback remoto es:

```bash
npm run db:test:remote
```

El script `scripts/run-remote-db-tests.mjs` ejecuta cada archivo con `npx supabase db query --remote --file ... --yes`; los archivos usan `begin`/`rollback` y un bloque `do` con `extensions.num_failed()` para fallar si alguna aserción no pasa. Resultado actual: 60 aserciones en 4 archivos (`001`: 16, `002`: 15, `003`: 7, `004`: 22).

1. `anon` no puede leer ni escribir ninguna tabla de negocio.
2. Un usuario autenticado distinto del propietario no ve ni modifica filas ajenas.
3. El propietario puede insertar y consultar clientes, eventos, catálogo y borradores.
4. Un `INSERT` con `owner_id` ajeno es rechazado.
5. Un contrato no puede referenciar un cliente o evento de otro propietario.
6. Un contrato confirmado no puede insertarse directamente desde el cliente.
7. Un contrato confirmado no puede actualizarse ni eliminarse desde el cliente.
8. Un borrador con pagos o documentos no puede eliminarse.
9. Un pago no puede actualizarse ni eliminarse.
10. Un pago que supere el total es rechazado.
11. Dos pagos concurrentes no pueden superar el total.
12. Reducir el total por debajo de los pagos existentes es rechazado.
13. Un `UPDATE` de contrato sin incrementar `version` es rechazado.
14. Cambiar `conditions` o `brand_snapshot` de una plantilla es rechazado.
15. Solo puede existir una plantilla activa por propietario.
16. `contract_counters` no es accesible directamente por `authenticated`.
17. La auditoría se crea automáticamente y no puede editarse ni eliminarse directamente desde el cliente.
18. La vista `contract_financials` devuelve el saldo correcto y respeta RLS.
19. Las políticas de Storage impiden leer objetos de contratos ajenos.
20. Las rutas de Storage sin un UUID de contrato válido son rechazadas.
21. Un segundo propietario no puede leer ni actualizar catálogo, clientes, documentos ni objetos de Storage ajenos.
22. El snapshot de marca de una plantilla es inmutable y el cliente no puede borrar metadatos de documentos ni auditoría.

### Verificación de la app

- `npm run typecheck` pasa con los tipos generados.
- `npm run lint` pasa.
- El cliente Supabase compila usando `Database`.
- No hay referencias a `service_role` en `app/`, `features/`, `lib/` ni `.env.local`.

### Verificación remota

- Aplicar migraciones en un branch de prueba antes de producción.
- Ejecutar una consulta con `anon key` y confirmar que devuelve cero filas o error de permiso.
- Ejecutar la misma consulta con la sesión del propietario y confirmar acceso solo a sus datos.
- No ejecutar pruebas destructivas contra el proyecto de producción.
- Estado actual: el proyecto remoto está vinculado y las 6 migraciones están aplicadas; el seed cargó 1 plantilla y 6 ítems de catálogo. Las pruebas pgTAP pasaron contra el proyecto remoto con `begin`/`rollback`. Como aún no existe un branch de prueba y el proyecto no tiene datos reales, se usó producción de forma controlada; antes de cargar datos reales se debe crear un branch o proyecto de pruebas.

## 18. Criterios de aceptación

1. Existen todas las tablas, enums, relaciones e índices descritos.
2. RLS está habilitado en todas las tablas de negocio y `anon` no tiene acceso.
3. El propietario solo puede leer y escribir sus propios registros.
4. Un segundo usuario autenticado no puede leer ni modificar datos del propietario.
5. Las FKs compuestas impiden mezclar propietarios, clientes y eventos.
6. Un contrato confirmado es de solo lectura para el cliente móvil.
7. Los pagos son append-only y la auditoría no se edita; el cliente no puede eliminarla directamente.
8. La suma de pagos no puede superar el total y no se puede reducir el total por debajo de los pagos.
9. Las versiones de plantilla son inmutables y solo hay una activa.
10. El bucket `contract-documents` es privado y sus políticas aplican al propietario.
11. `contract_financials` calcula el saldo derivado correctamente.
12. Los tipos TypeScript generados compilan con el cliente actual.
13. Las pruebas SQL pasan en local o branch de prueba.
14. `npm run typecheck` y `npm run lint` pasan.
15. `progress-tracker.md` se actualiza con el estado y las dependencias pendientes.

## 19. Seguridad y privacidad

- Ninguna tabla de negocio es accesible sin sesión.
- La app no incluye `service_role`; las operaciones privilegiadas viven en Edge Functions o RPC con autorización.
- RLS se prueba con `anon`, propietario y un segundo usuario autenticado.
- No se guardan tokens ni secretos en tablas de negocio.
- La auditoría no registra tokens, URLs firmadas ni contraseñas.
- Las políticas de Storage validan la propiedad mediante el contrato, no solo por la ruta.
- Los datos de marca y contacto se configuran desde Ajustes; no se hardcodean datos reales en migraciones o componentes.
- La retención de 5 años y la Ley 29733 siguen pendientes de validación legal; esta feature no implementa purga.

## 20. Riesgos y mitigaciones

| Riesgo                                                        | Mitigación                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Una política RLS olvidada expone datos                        | Probar todas las tablas con `anon` y con un segundo usuario autenticado.                       |
| FKs simples permiten mezclar propietarios                     | Usar FKs compuestas y pruebas de cruce entre usuarios.                                         |
| El cliente modifica un contrato confirmado                    | RLS solo permite escrituras directas en `draft`; las transiciones usan RPC en Feature 003.     |
| Dos pagos concurrentes superan el total                       | Bloquear la fila del contrato con `FOR UPDATE` dentro del trigger.                             |
| Se reduce el total después de cobrar                          | Trigger que compara el nuevo total con la suma de pagos.                                       |
| Una plantilla se edita y cambia contratos históricos          | Trigger de inmutabilidad y snapshots en el contrato.                                           |
| La numeración se duplica o deja huecos                        | Contador con PK, bloqueo de fila y RPC transaccional en Feature 003; nunca acceso directo.     |
| La `service_role` se filtra                                   | No incluirla en el cliente, EAS ni archivos versionados; revisar el bundle.                    |
| Storage permite leer objetos ajenos                           | Política basada en el UUID del contrato y su `owner_id`; probar rutas manipuladas.              |
| El seed inserta datos reales o precios incorrectos            | Seed solo de desarrollo, precios editables y sin teléfonos/redes inventados.                   |
| Se pierde la capacidad de reproducir el esquema               | Migraciones versionadas y tipos generados; no editar migraciones aplicadas.                    |

## 21. Observabilidad

- Sin analytics en el MVP.
- Los errores de RLS y restricciones se registran en Supabase con códigos, no con PII.
- La auditoría de negocio vive en `contract_audit_log`; no sustituye los logs de infraestructura.
- Las pruebas de RLS forman parte de la verificación previa a cada cambio de esquema.
- No se registran tokens, contraseñas, correos completos ni rutas firmadas.

## 22. Definición de terminado

- Migraciones aplicadas y verificadas en Supabase remoto; branch de prueba pendiente antes de datos reales.
- RLS y Storage probados con `anon`, propietario y segundo usuario (60 aserciones pgTAP).
- Restricciones de importes, versión, plantillas y append-only probadas.
- Bucket privado y políticas de Storage creados.
- Tipos generados desde el remoto y cliente Supabase tipado.
- Seed de referencia documentado y sin datos personales reales.
- `npm run typecheck` y `npm run lint` pasan.
- `progress-tracker.md` actualizado con el resultado y los pendientes.
- `architecture.md` y `code-standards.md` actualizados si la implementación ajusta el modelo.

## 23. Checklist de implementación

- [x] Inicializar `supabase/config.toml` y estructura de migraciones.
- [x] Crear enums y helpers.
- [x] Crear `clients`, `events`, `service_catalog` y `brand_settings`.
- [x] Crear `contract_templates`, `contracts`, `contract_payments`, `contract_documents`, `contract_audit_log` y `contract_counters`.
- [x] Crear FKs compuestas, checks, índices y vista `contract_financials`.
- [x] Implementar triggers de `updated_at`, versión, importes, append-only y auditoría.
- [x] Habilitar RLS y crear políticas por tabla.
- [x] Crear bucket privado `contract-documents` y políticas de Storage.
- [x] Crear `seed.sql` de referencia sin PII.
- [x] Generar `types/database.ts` y tipar `lib/supabase.ts` con `SupabaseClient<Database>`.
- [x] Escribir pruebas SQL de RLS, restricciones y triggers.
- [x] Ejecutar migraciones y seed en PostgreSQL embebido (PGlite) con bootstrap de `auth`/`storage`.
- [x] Ejecutar pruebas pgTAP en Supabase remoto (60 aserciones, 4 archivos).
- [x] Regenerar `types/database.ts` desde el proyecto remoto (UTF-8 sin BOM).
- [x] Agregar scripts remotos `db:push:remote`, `db:seed:remote`, `db:test:remote` y `db:types:remote`.
- [x] Ejecutar `npm run typecheck` y `npm run lint`.
- [x] Documentar el runbook de aplicación y regeneración de tipos.
- [x] Actualizar `progress-tracker.md`.

## 24. Siguiente feature

Feature 003: operaciones transaccionales de contratos — RPC de confirmación con numeración gapless, registro de pagos, transiciones de estado, anulación con reemplazo enlazado y auditoría semántica.
