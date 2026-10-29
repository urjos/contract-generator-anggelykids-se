# Progress Tracker

Actualiza este archivo al completar cada cambio significativo.

## Current Phase

Unidad 1 — scaffold base del proyecto (Expo + NativeWind + estructura).

## Current Goal

Verificar typecheck, lint y bundle de Android; luego iniciar la Unidad 2 con Supabase (cuenta propietaria, migraciones y RLS).

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

## In Progress

- Verificación del scaffold: `npm run typecheck`, `npm run lint` y bundle de Android.

## Next Up

1. Recibir el logo PNG y la lista definitiva de teléfonos/redes para la plantilla del PDF.
2. Crear el proyecto Supabase y configurar la cuenta propietaria única (signups desactivados).
3. Escribir las migraciones iniciales: clientes, eventos, contratos, pagos, plantillas, documentos, auditoría y RLS.
4. Implementar inicio de sesión, recuperación de contraseña y bloqueo de rutas.

## Open Questions

- ¿Formato final del número de contrato: `00001` o `2026-00001`? ¿Secuencia `nextval` con posibles huecos o contador bloqueado sin huecos?
- ¿Concurrencia multi-dispositivo: last-write-wins o bloqueo optimista con `updated_at` y aviso de conflicto?
- ¿Confirmamos `America/Lima` fijo y `event.starts_at` como `timestamptz`?
- ¿El alta de la cuenta única se hace manualmente en Supabase con signups desactivados?
- ¿Teléfono de cliente único para deduplicar? ¿Un contrato puede cubrir varios eventos?
- ¿"Próximos eventos" requiere recordatorios/notificaciones o solo una sección ordenada por fecha?
- ¿Se necesita exportación/backup (CSV o ZIP de PDFs) y qué retención de PII aplica (Ley 29733)?
- ¿Supabase local con Docker para migraciones o solo proyecto remoto?
- ¿Se moverá el repositorio fuera de OneDrive para evitar problemas de file watching y locks?

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

## Session Notes

- En WSL, Node se instaló en `~/.local/node/bin` (v24.19.0); hay que anteponerlo al `PATH` porque el `node` de Windows está roto en este entorno.
- `npm install` tarda varios minutos por estar el repo en OneDrive sobre `/mnt/c`.
- NativeWind 4.2.7 declara soporte hasta Expo SDK 57; se está verificando sobre SDK 58. Si el bundle falla, la alternativa es NativeWind 5 RC o fijar SDK 57.
- Los assets de icono y splash siguen siendo los genéricos de Expo hasta recibir la marca oficial.
