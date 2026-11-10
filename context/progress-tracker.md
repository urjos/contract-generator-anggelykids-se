# Progress Tracker

Actualiza este archivo al completar cada cambio significativo.

## Current Phase

Fase 4 — Operaciones de contratos concluida. Features 001, 002, 003, 004 y 004b implementadas y verificadas en Android. La 004 cubre listado, búsqueda, borrador, detalle, pagos, historial y acciones; la 004b agrega la configuración de datos de marca en Ajustes. `typecheck`, `lint` y `export:android` pasan.

## Current Goal

Abrir Feature 005 (PDF desde el snapshot y Edge Function). Mantener como pendiente externo la redirect URL `anggelykids://reset-password` en Supabase y la creación de un branch/entorno de pruebas para pgTAP antes de operar con datos reales.

## Completed

- Definido el problema, operación individual y alcance inicial de Anggely Kids Contratos.
- Propuesto el flujo de creación, confirmación y consulta de contratos.
- Establecidos stack, límites de sistema, entidades, acceso de operador único, invariantes y estructura de carpetas.
- Definidos lineamientos de UI, accesibilidad y estándares de código.
- Registrado un orden de implementación para la primera versión.
- Analizado el formato físico real y definido el mapeo de sus campos, pagos, notas y firmas en `contract-template.md`.
- Identificadas las categorías y paquetes visibles del sitio público como semilla editable del catálogo.
- Definida una nueva serie digital de contratos, con inicio en `00001`.
- Confirmado que las condiciones actuales se conservan, la movilidad es un cargo opcional y todo PDF incluye marca y datos de contacto.
- Resueltas las cuatro decisiones de arquitectura: pagos en `contract_payments`, anulación con reemplazo enlazado, plantillas versionadas editables en Ajustes y PDF generado en Edge Function con descarga y WhatsApp.
- Sincronizados `project-overview.md`, `architecture.md`, `contract-template.md` y `AGENTS.md` con esas decisiones.
- Creado el proyecto Expo SDK 58 (React Native 0.88, TypeScript estricto) con Expo Router.
- Configurado NativeWind 4.2.7 + Tailwind CSS 3 con tokens semánticos en `theme/tokens.json`.
- Creada la estructura `app/`, `components/ui/`, `features/`, `lib/`, `stores/`, `types/`, `supabase/`.
- Implementada la navegación inferior inicial: Inicio, Contratos, Crear, Clientes y Ajustes, con safe areas e iconos lucide.
- Implementados `Screen`, `AppText` y pantallas placeholder con el tema claro aprobado.
- Resueltas las preguntas abiertas de numeración, concurrencia, zona horaria, alta de cuenta, deduplicación, eventos por contrato, notificaciones, retención, entorno Supabase y ubicación del repositorio.
- Creada `context/feature-specs/001-acceso-cuenta-propietaria.md` como primera unidad funcional.
- Creada `assets/brand/` con placeholders de logo, firma de la representante, iconos, splash y favicon; `app.json` apunta a esos activos.
- Creada la plantilla `.env.example` para las variables públicas de Supabase.
- Implementado `lib/env.ts`, `lib/secure-store.ts` con chunking y `lib/supabase.ts` con PKCE.
- Implementados `AuthProvider`, `useAuth`, `auth-service.ts`, schemas Zod y traducción de errores de Supabase.
- Implementadas las pantallas de login, solicitud de recuperación y nueva contraseña con deep link.
- Implementadas las guardas de rutas con `Stack.Protected`, restauración de sesión con reintento y refresco al volver del background.
- Agregado cierre de sesión con confirmación en Ajustes y actualizados los textos de Inicio.
- Verificados `npm run typecheck`, `npm run lint` y `npm run export:android`; se agregó `tslib` para resolver el bundle de Supabase.
- Creada `context/feature-specs/002-modelo-datos-inicial-rls.md` con el modelo de datos, RLS, Storage, triggers, pruebas y runbook.
- Corregido el checklist de Feature 001 para reflejar que la configuración real de Supabase y la prueba Android siguen pendientes.
- Creados `supabase/config.toml`, scripts `db:reset`, `db:test` y `db:types`, y migraciones `20261103000100` a `20261103000600`.
- Implementados enums, tablas, FKs compuestas, checks, índices, vista `contract_financials`, triggers de integridad/auditoría, RLS y bucket privado `contract-documents`.
- Creado `supabase/seed.sql` con plantilla v1 y catálogo de referencia sin PII.
- Creados `types/database.ts` y el cliente tipado en `lib/supabase.ts`.
- Creados tests pgTAP `001_rls`, `002_constraints` y `003_audit_and_payments`.
- Validada la sintaxis SQL externa con el parser `libpg-query`.
- Ejecutadas las migraciones y el seed en PostgreSQL 18 embebido (PGlite) con un bootstrap de `auth`/`storage`; 40 comprobaciones de RLS, triggers, restricciones, borrado de borradores, auditoría, vista financiera y Storage pasaron.
- Verificados `npm run typecheck` y `npm run lint`.
- Aplicadas las 6 migraciones y el seed en el proyecto remoto `contract-generator-anggelykids-se` (`twowiheotxnhljowtady`), vinculado como producción: 10 tablas públicas, 1 plantilla y 6 ítems de catálogo.
- Creados los scripts remotos `db:push:remote`, `db:push:remote:dry`, `db:seed:remote`, `db:test:remote` y `db:types:remote`.
- Creado `scripts/run-remote-db-tests.mjs` para ejecutar pgTAP con `supabase db query --file` cuando Docker no está disponible.
- Agregado `004_storage_and_edge_cases.test.sql`; las 60 aserciones de `001`–`004` pasaron contra Supabase remoto.
- Corregidos los tests para reflejar el comportamiento real de Supabase: `immutable_table` en DELETE de pagos y cero filas visibles para `anon` en Storage.
- Regenerado `types/database.ts` desde el esquema remoto en UTF-8 sin BOM; `npm run typecheck` y `npm run lint` pasan.
- Verificado en Android el login, la persistencia de sesión y el logout de Feature 001.
- Creada `context/feature-specs/003-operaciones-transaccionales-contratos.md` con la máquina de estados, RPC, snapshot, numeración, pagos, auditoría, RLS, pruebas y criterios de aceptación.
- Creada la migración `20261103000700_contract_operations.sql` con `next_contract_number`, `build_contract_snapshot`, las RPC de confirmar, firmar, cancelar, anular con reemplazo, archivar y registrar pago, el nuevo trigger de auditoría semántica y la revocación del `INSERT` directo de pagos.
- Ajustada `contracts_status_requirements` en la migración `00700` para que `archived` conserve `cancelled_at` y `cancellation_reason` de contratos cancelados o anulados.
- Creada la migración `20261103000800_contract_read_model.sql` con la vista `contract_overview` (`security_invoker = true`) y permisos solo para `authenticated`.
- Implementados `features/contracts/contract-service.ts`, `contract-schemas.ts` y `contract-errors.ts` con Zod y traducción de tokens de error.
- Actualizados `supabase/tests/001_rls.test.sql` y `types/database.ts` para el nuevo contrato de pagos y los tipos RPC/vista generados desde remoto.
- Creadas `005_contract_operations.test.sql` (98 aserciones) y `006_contract_read_model.test.sql` (18 aserciones); las seis suites pgTAP pasan contra el proyecto remoto.
- Verificados `npm run typecheck`, `npm run lint` y `npm run db:push:remote` con las migraciones aplicadas.
- Creada `context/feature-specs/004-ui-contratos.md` con alcance, flujos, rutas, validaciones, criterios y checklist.
- Incorporado `@tanstack/react-query` con `lib/query-client.ts` y `QueryClientProvider` en el layout raíz.
- Creados formateadores centralizados en `lib/format.ts` para PEN, fechas `America/Lima`, teléfonos, importes y búsqueda segura.
- Creados componentes UI reutilizables: campo de texto, banner de error, cabecera, tarjeta de sección, estado vacío/error, hoja modal y chips de opción.
- Ampliados `contract-service.ts`, `contract-schemas.ts` y `contract-errors.ts` con lecturas de `contract_overview`, pagos, auditoría, borradores y traducción de errores de PostgREST.
- Creados `features/clients/client-service.ts` y `features/catalog/catalog-service.ts`.
- Implementado el listado de contratos con búsqueda, filtros por estado, archivados y tarjetas con saldo.
- Implementado el formulario de creación y edición de borrador con reutilización de clientes, paquetes, normalización de fecha/teléfono e importes en céntimos.
- La fecha y la hora se eligen con `@react-native-community/datetimepicker`; la selección completa el valor `AAAA-MM-DD HH:mm` en hora de Lima.
- El celular se captura como `999 999 999`, se limita a 9 dígitos y se normaliza a `+51`; cantidades distintas se rechazan en el formulario y en el payload.
- Implementado el detalle con cliente, evento, importes, notas, pagos, historial y acciones por estado.
- Implementadas las acciones de confirmar, firmar, cancelar, anular con reemplazo, archivar, eliminar borrador y registrar pago.
- Registradas las rutas protegidas `contracts/[id]/index` y `contracts/[id]/edit`.
- Creada `context/feature-specs/004b-ajustes-datos-marca.md` para desbloquear la confirmación de contratos.
- Creada la migración `20261103000900_brand_settings_writes.sql` que otorga `select`, `insert` y `update` sobre `brand_settings` a `authenticated`; las políticas RLS existentes siguen limitando la fila al propietario.
- Implementados `brand-types.ts`, `brand-schemas.ts`, `brand-errors.ts`, `brand-service.ts` y `use-brand-settings.ts`.
- Implementado el formulario `Datos de marca` en Ajustes con nombre comercial, teléfono, WhatsApp e Instagram, Facebook y TikTok opcionales.
- El formulario normaliza teléfonos a `+51` y exige exactamente 9 dígitos; actualiza la fila existente o la crea si falta.
- Actualizado el mensaje de `contract_brand_unavailable` para dirigir a Ajustes.
- Verificados `npm run typecheck`, `npm run lint` y `npm run export:android`.
- Aplicada la migración `20261103000900` al proyecto remoto; los grants de `select`, `insert` y `update` se verificaron con `has_table_privilege` y con un insert/update bajo el rol `authenticated` dentro de una transacción con rollback.
- Verificada manualmente en Android la configuración de marca y el recorrido completo de Feature 004: listado, borrador, detalle, pagos y acciones de estado. Feature 004 y 004b cerradas.

## In Progress

- Ninguna implementación bloqueada. Pendientes externos: confirmar la redirect URL `anggelykids://reset-password` en el dashboard de Supabase y crear un branch/entorno de pruebas antes de cargar datos reales.

## Next Up

1. Confirmar `anggelykids://reset-password` y la URL de desarrollo de Expo en las redirect URLs de Supabase.
2. Crear un branch o proyecto de pruebas y mover allí la ejecución de `npm run db:test:remote` antes de cargar datos reales.
3. Implementar Feature 005: PDF desde `template_snapshot`, Edge Function, `contract_documents`, descarga y WhatsApp.
4. Mantener `npm run db:test:remote`, `npm run typecheck`, `npm run lint` y `npm run export:android` en verde antes de abrir cada feature.

## Resolved Questions

| #   | Pregunta                         | Decisión                                                                                                                                                                        |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Formato del número de contrato   | Serie independiente de 5 dígitos, `N° 00001`, sin prefijo de año.                                                                                                               |
| 2   | Estrategia de secuencia          | Contador gapless en `contract_counters`, asignado al confirmar dentro de la misma transacción con bloqueo de fila. Los borradores no consumen número.                           |
| 3   | Concurrencia multi-dispositivo   | Bloqueo optimista con columna `version`; si el `UPDATE` no afecta la versión esperada se muestra conflicto y no se sobrescribe.                                                 |
| 4   | Zona horaria                     | `America/Lima` fija. `event.starts_at` es `timestamptz`; se muestra en `es-PE`.                                                                                                 |
| 5   | Alta de la cuenta única          | Manual en el dashboard de Supabase, con signups desactivados. Sin registro en la app.                                                                                           |
| 6   | Teléfono de cliente              | Se normaliza a E.164 y se usa para sugerir clientes existentes, pero no es un índice único: un mismo teléfono puede compartirse.                                                 |
| 7   | Varios eventos por contrato      | Un contrato cubre exactamente un evento. Varios eventos requieren contratos separados.                                                                                          |
| 8   | Próximos eventos                 | Solo sección ordenada por fecha en Inicio; sin notificaciones ni recordatorios en el MVP.                                                                                       |
| 9   | Exportación y retención          | Sin exportación CSV/ZIP en el MVP. Retención operativa de 5 años desde la firma y revisión manual posterior; sin purga automática. Sujeta a validación legal.                    |
| 10  | Supabase local                   | Solo proyecto remoto para el MVP; migraciones versionadas con Supabase CLI. Docker local es opcional para desarrollo.                                                            |
| 11  | Ubicación del repositorio        | El proyecto ya vive en `C:\Projects\Android`, fuera de OneDrive. Se mantiene allí.                                                                                              |
| 12  | Fuente del documento de contrato | MVP con fuentes estándar del PDF (`Times-Roman` para cuerpo y `Helvetica-Bold` para títulos) y fuente del sistema en la previsualización. Sin fuentes personalizadas embebidas. |
| 13  | Firma en el PDF                  | La firma de la representante se usa como PNG estático desde `assets/brand/signature.png`. La firma del cliente sigue siendo confirmación manual con fecha en el MVP.             |
| 14  | Nomenclatura de la base de datos | Tablas, columnas, enums y claves internas en inglés; etiquetas de UI y documentos en español.                                                                                   |
| 15  | Acceso directo a contratos       | El cliente solo puede crear, editar y eliminar borradores. Confirmar, firmar, cancelar o archivar requerirá RPC `security definer` en Feature 003.                              |
| 16  | Numeración y contadores          | `contract_counters` no tiene acceso directo para `authenticated`; la asignación gapless se implementa en la RPC de Feature 003.                                                  |
| 17  | Modelo de propiedad              | Todas las tablas usan `owner_id` con `default auth.uid()` y RLS; las FKs compuestas impiden mezclar propietario, cliente y evento.                                              |
| 18  | Datos de marca en seed           | No se siembran teléfonos, redes ni marcas inventadas; `brand_settings` se configura con datos reales antes de generar PDFs.                                                      |
| 19  | Pruebas pgTAP sin Docker         | `npx supabase test db --remote` requiere Docker. Se usa `supabase db query --file` dentro de `begin`/`rollback` y se ejecuta desde `scripts/run-remote-db-tests.mjs`.            |
| 20  | Escritura directa de pagos       | Desde Feature 003 se revoca `INSERT` de `contract_payments` a `authenticated`; toda alta pasa por `record_contract_payment` para validar propietario y estado.                    |
| 21  | Archivo de contratos cerrados    | `archived` es terminal y conserva los campos de cancelación de su estado previo; `contracts_status_requirements` se reemplazó en `00700` para permitirlo.                        |
| 22  | Navegación de la UI de contratos | El detalle y la edición viven en `contracts/[id]/index` y `contracts/[id]/edit` bajo `Stack.Protected`; la pestaña Crear siempre inicia un borrador nuevo.                      |
| 23  | Estado remoto de la UI           | TanStack Query administra listado, detalle, pagos, auditoría, clientes y catálogo; las mutaciones invalidan todas las consultas de contratos.                                   |
| 24  | Pagos en borradores              | La UI permite registrar pagos mientras el contrato siga en `draft`; el adelanto puede existir antes de confirmar y la RPC valida el total.                                    |
| 25  | Edición de datos de marca        | `brand_settings` se edita desde Ajustes con `insert`/`update` directos bajo RLS; la fila es única por propietario y se crea si no existe antes de confirmar.                    |

## Open Questions

Ninguna bloquea el desarrollo. Quedan dependencias externas y decisiones para features posteriores:

- Confirmación legal del texto de condiciones; hasta entonces se conserva literal y versionado.
- Archivos oficiales del logo y de la firma de la representante para reemplazar los placeholders de `assets/brand/`.
- Teléfonos y redes sociales definitivos para el bloque de marca del PDF.
- Si el correo integrado de Supabase no entrega de forma fiable, configurar SMTP propio antes de producción.
- Corrección de pagos erróneos: al ser append-only, no se editan ni eliminan. Definir si se añadirá un movimiento de reverso con motivo.
- Confirmar con la responsable si el adelanto en borradores debe mantenerse; hoy la UI y la RPC lo permiten.
- Validar con la responsable el vocabulario final de `event_type`; cualquier tipo nuevo requiere migración.
- Definir si el logo y la firma de la representante vivirán en un bucket de Storage o solo en `assets/brand/` para el MVP.
- Confirmar `anggelykids://reset-password` en las redirect URLs del proyecto Supabase remoto; el flujo de recuperación no se considera cerrado hasta probarlo en Android.
- Crear un branch o proyecto Supabase de pruebas antes de cargar datos reales; hoy pgTAP corre contra producción con rollback y el proyecto está vacío.

## Architecture Decisions

- Se usará Expo SDK 58 + React Native 0.88 + TypeScript estricto, Expo Router, NativeWind 4.2.7, `react-native-safe-area-context`, EAS y Supabase.
- Los tokens de color viven en `theme/tokens.json` y alimentan tanto `tailwind.config.js` como las APIs imperativas.
- Supabase PostgreSQL será la fuente de verdad; Storage albergará documentos generados.
- Una única cuenta propietaria de Supabase Auth más RLS protege los datos y permite recuperarlos en varios dispositivos.
- Los contratos firmados serán inmutables: se anulan con motivo y se reemplazan con un contrato enlazado.
- Los pagos son movimientos append-only en `contract_payments`; "a cuenta" y saldo se derivan.
- Las plantillas de contrato son versiones inmutables editables desde Ajustes.
- El PDF se genera en una Edge Function desde el snapshot y se comparte por descarga y WhatsApp.
- El MVP es para operación interna y prioriza Android, sin cerrarse a iOS.
- Los importes se guardarán en céntimos de PEN.
- La numeración es gapless y se asigna solo al confirmar el contrato.
- Las mutaciones de contratos usan bloqueo optimista con `version`.
- La configuración de marca (logo, firma, contacto y redes) vive en `brand_settings` y se copia al snapshot del contrato.
- Los activos visuales de la app viven en `assets/brand/`; los placeholders deben sustituirse por los archivos oficiales antes de producción.
- La validación de esquema y RLS se ejecuta contra Supabase remoto mediante `db query --file` mientras no haya Docker; los archivos pgTAP se envuelven en transacciones con rollback.

## Session Notes

- En WSL, Node se instaló en `~/.local/node/bin` (v24.19.0); hay que anteponerlo al `PATH` porque el `node` de Windows está roto en este entorno.
- `npm install` sobre `/mnt/c` falló con `ENOENT: rename` por la sincronización de OneDrive. El repositorio actual está en `C:\Projects\Android`, fuera de OneDrive; la instalación la hará el usuario en el entorno que prefiera.
- NativeWind 4.2.7 declara soporte hasta Expo SDK 57; se está verificando sobre SDK 58. Si el bundle falla, la alternativa es NativeWind 5 RC o fijar SDK 57.
- Los activos de `assets/brand/` son placeholders generados para desarrollo; el logo y la firma oficiales deben reemplazarlos conservando los nombres y proporciones indicados en `assets/brand/README.md`.
- Sigue sin haber Docker, por lo que `npx supabase test db --remote` no puede ejecutarse. El fallback es `npm run db:test:remote`, que usa `npx supabase db query --remote --file ... --yes`; no requiere Docker.
- El CLI de Supabase v3.0.0 está autenticado y el proyecto remoto está vinculado. `db:push:remote` y `db:seed:remote` usan el proyecto vinculado; `db:types:remote` genera desde el remoto.
- Las pruebas pgTAP usan `begin`/`rollback` y un bloque `do` con `extensions.num_failed()` para fallar si alguna aserción no pasa. Se ejecutaron contra producción mientras el proyecto no tiene datos reales; crear un branch antes de operar con datos reales.
- Si se genera `types/database.ts` desde PowerShell, usar `UTF8Encoding(false)` para evitar BOM; se verificó que el archivo actual empieza en `export`.
- Las RPC usan `security definer` con `search_path = public, pg_temp`; los helpers `next_contract_number` y `build_contract_snapshot` no tienen `EXECUTE` para roles de API.
- La numeración se prueba con un incremento dentro de un bloque `exception` que fuerza rollback; el contador conserva el mismo `next_value`.
- El proyecto remoto sigue sin datos reales, por lo que las suites pgTAP con `begin`/`rollback` se ejecutaron contra producción; crear el branch antes de cargar datos reales.
- Feature 004 agregó `@tanstack/react-query` como dependencia directa y crea el `QueryClient` una sola vez en el layout raíz.
- Se agregó `@react-native-community/datetimepicker` con su config plugin para los selectores de fecha y hora; el valor de formulario sigue siendo el texto `AAAA-MM-DD HH:mm` en hora de Lima.
- La creación y edición de borradores se hace con inserts/updates directos bajo RLS, con limpieza o restauración best-effort si falla un paso intermedio; no se añadió una RPC nueva. Si el flujo crece, conviene moverlo a una RPC transaccional.
- La fecha del evento se interpreta explícitamente en `America/Lima` con offset `-05:00`; no depende de la zona horaria del dispositivo.
- El detalle y la edición de contratos usan rutas anidadas protegidas; la pestaña Crear se remonta al recibir foco para no conservar un formulario anterior.
- La migración `00900` solo agrega los grants de escritura de `brand_settings`; las políticas RLS ya existentes restringen la fila a `owner_id = auth.uid()` e `id = 1`.
- La confirmación de contratos fallaba con `contract_brand_unavailable` porque el seed no crea marca; ahora Ajustes crea la fila con nombre comercial, teléfono, WhatsApp y redes opcionales.
- La responsable confirmó en Android que la Feature 004 y la configuración de marca funcionan; la fase 4 queda cerrada.
