# Progress Tracker

Actualiza este archivo al completar cada cambio significativo.

## Current Phase

Fase 2 — Supabase Auth. Feature 001 implementada; pendiente configuración real y verificación en Android.

## Current Goal

Configurar `.env.local` y las redirect URLs de Supabase, luego probar login, persistencia, recuperación y logout en un development build de Android.

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

## In Progress

- Configuración del proyecto Supabase real y verificación manual del flujo completo en Android.

## Next Up

1. Completar `.env.local` con Project URL y anon key.
2. Agregar `anggelykids://reset-password` y la URL de desarrollo de Expo a las redirect URLs de Supabase.
3. Probar login, persistencia, recuperación, enlaces inválidos, modo avión y logout en Android.
4. Escribir las migraciones iniciales y RLS como Feature 002.

## Resolved Questions

| # | Pregunta | Decisión |
| --- | --- | --- |
| 1 | Formato del número de contrato | Serie independiente de 5 dígitos, `N° 00001`, sin prefijo de año. |
| 2 | Estrategia de secuencia | Contador gapless en `contract_counters`, asignado al confirmar dentro de la misma transacción con bloqueo de fila. Los borradores no consumen número. |
| 3 | Concurrencia multi-dispositivo | Bloqueo optimista con columna `version`; si el `UPDATE` no afecta la versión esperada se muestra conflicto y no se sobrescribe. |
| 4 | Zona horaria | `America/Lima` fija. `event.starts_at` es `timestamptz`; se muestra en `es-PE`. |
| 5 | Alta de la cuenta única | Manual en el dashboard de Supabase, con signups desactivados. Sin registro en la app. |
| 6 | Teléfono de cliente | Se normaliza a E.164 y se usa para sugerir clientes existentes, pero no es un índice único: un mismo teléfono puede compartirse. |
| 7 | Varios eventos por contrato | Un contrato cubre exactamente un evento. Varios eventos requieren contratos separados. |
| 8 | Próximos eventos | Solo sección ordenada por fecha en Inicio; sin notificaciones ni recordatorios en el MVP. |
| 9 | Exportación y retención | Sin exportación CSV/ZIP en el MVP. Retención operativa de 5 años desde la firma y revisión manual posterior; sin purga automática. Sujeta a validación legal. |
| 10 | Supabase local | Solo proyecto remoto para el MVP; migraciones versionadas con Supabase CLI. Docker local es opcional para desarrollo. |
| 11 | Ubicación del repositorio | El proyecto ya vive en `C:\Projects\Android`, fuera de OneDrive. Se mantiene allí. |
| 12 | Fuente del documento de contrato | MVP con fuentes estándar del PDF (`Times-Roman` para cuerpo y `Helvetica-Bold` para títulos) y fuente del sistema en la previsualización. Sin fuentes personalizadas embebidas. |
| 13 | Firma en el PDF | La firma de la representante se usa como PNG estático desde `assets/brand/signature.png`. La firma del cliente sigue siendo confirmación manual con fecha en el MVP. |

## Open Questions

Ninguna bloquea el desarrollo. Quedan dependencias externas:

- Confirmación legal del texto de condiciones; hasta entonces se conserva literal y versionado.
- Archivos oficiales del logo y de la firma de la representante para reemplazar los placeholders de `assets/brand/`.
- Teléfonos y redes sociales definitivos para el bloque de marca del PDF.
- Si el correo integrado de Supabase no entrega de forma fiable, configurar SMTP propio antes de producción.

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

## Session Notes

- En WSL, Node se instaló en `~/.local/node/bin` (v24.19.0); hay que anteponerlo al `PATH` porque el `node` de Windows está roto en este entorno.
- `npm install` sobre `/mnt/c` falló con `ENOENT: rename` por la sincronización de OneDrive. El repositorio actual está en `C:\Projects\Android`, fuera de OneDrive; la instalación la hará el usuario en el entorno que prefiera.
- NativeWind 4.2.7 declara soporte hasta Expo SDK 57; se está verificando sobre SDK 58. Si el bundle falla, la alternativa es NativeWind 5 RC o fijar SDK 57.
- Los activos de `assets/brand/` son placeholders generados para desarrollo; el logo y la firma oficiales deben reemplazarlos conservando los nombres y proporciones indicados en `assets/brand/README.md`.
