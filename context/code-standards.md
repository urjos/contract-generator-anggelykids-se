# Code Standards

## General

- TypeScript estricto en todo el proyecto. No usar `any`.
- Mantener módulos pequeños y con una responsabilidad clara.
- Nombrar código en inglés; presentar textos de interfaz y documentación de producto en español.
- No mezclar navegación, consulta remota, validación y presentación en un mismo componente.
- Solucionar la causa raíz; no ocultar errores de red o autorización con estados falsamente exitosos.

## TypeScript

- `strict: true` es obligatorio.
- Validar formularios con Zod antes de persistir y datos externos antes de usarlos en UI.
- Modelar estados de contrato como uniones literales o enums bien tipados.
- Preferir importes enteros en céntimos y funciones de formato centralizadas.

## React Native and Expo

- Usar Expo Router: pantallas delgadas en `app/` y lógica de dominio en `features/`.
- Preferir APIs compatibles con Expo managed workflow para preservar compatibilidad con EAS.
- `react-native-safe-area-context` es obligatorio. El layout raíz usa `SafeAreaProvider` y cada pantalla, barra u overlay respeta los insets mediante `SafeAreaView` o `useSafeAreaInsets`.
- Probar Android con áreas seguras, teclado, tamaños de texto y pantallas pequeñas.
- Usar fechas `es-PE` y moneda PEN en toda la interfaz.

## Styling

- Usar NativeWind y tokens semánticos definidos en `ui-context.md`; no usar colores hardcodeados en componentes.
- La fuente única de tokens es `theme/tokens.json`; `tailwind.config.js` y `constants/theme.ts` la consumen. No agregar colores nuevos fuera de ese archivo.
- Para props que no aceptan `className` (navegación, iconos, splash), importar `colors` desde `constants/theme.ts`.
- Priorizar controles táctiles accesibles, etiquetas visibles y contraste suficiente.
- Usar `lucide-react-native` para iconos cuando se añada la dependencia.

## Data, Access and Networking

- Centralizar el cliente de Supabase en `lib/supabase.ts`; no crear clientes ad hoc en pantallas.
- Centralizar la sesión de la única cuenta propietaria de Supabase en un punto de infraestructura; no crear registro abierto, roles, perfiles ni gestión de usuarios.
- Todas las tablas, buckets y Edge Functions deben aplicar RLS/autorización del lado servidor para `auth.uid()`.
- TanStack Query administra datos remotos, cargas, errores e invalidación.
- Zustand se reserva para preferencias y estado temporal; no duplica contratos persistidos.
- Mostrar estados de carga, vacío, error y reintento en las vistas que dependen de red.
- No registrar PII completa, tokens, documentos de identidad, direcciones exactas ni URLs firmadas.

## Auth and Session

- Usar `@supabase/supabase-js` con `expo-secure-store` para persistir la sesión; no usar AsyncStorage para tokens. Si la sesión supera el límite de SecureStore en Android, dividirla en chunks con claves estables y reconstruirla al leer.
- Configurar `autoRefreshToken`, `persistSession` y `flowType: 'pkce'`; refrescar la sesión al volver del background.
- La sesión se expone mediante un contexto/hook de `features/auth`; las pantallas no crean clientes de Supabase.
- Si la restauración de sesión falla por red, mostrar un estado de error con reintento; no simular una sesión válida. Una sesión revocada se trata como no autenticada.
- Traducir los errores de Supabase a mensajes de producto en `features/auth/auth-errors.ts`; no mostrar mensajes técnicos crudos ni registrar tokens o PII.
- No existe registro abierto, OAuth, roles ni perfiles. Solo login, logout y recuperación de contraseña de la cuenta propietaria.
- Las variables públicas son `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`; `SUPABASE_SERVICE_ROLE_KEY` nunca entra al cliente.

## Contracts and Storage

- Enviar mutaciones de contratos mediante casos de uso de `features/contracts`, no desde componentes genéricos.
- Tratar `firmado` como estado inmutable y registrar transiciones en la bitácora.
- Los documentos pertenecen a Storage; los metadatos y snapshots a PostgreSQL.
- Asignar el número de contrato solo al confirmar, dentro de la transacción que bloquea `contract_counters`.
- Enviar la `version` esperada en cada mutación y tratar la ausencia de filas afectadas como conflicto, no como éxito.
- Formatear fechas en `America/Lima`/`es-PE` y moneda en PEN desde funciones centralizadas.

## Assets

- Los activos de marca viven en `assets/brand/` y se referencian por ruta estable; no duplicar logos o firmas en otras carpetas.
- Los placeholders de desarrollo deben conservar nombres y proporciones para que el reemplazo por los archivos oficiales no requiera cambios de código.
- No incluir datos de contacto reales hardcodeados en componentes; leerlos de `brand_settings` o de la configuración de entorno.

## File Organization

- `app/` — rutas y layouts de Expo Router.
- `components/ui/` — controles visuales reutilizables.
- `features/<domain>/` — pantallas compuestas, hooks, schemas, servicios y pruebas de un dominio.
- `lib/` — infraestructura compartida sin UI.
- `stores/` — estado local de aplicación.
- `types/` — tipos comunes y tipos generados desde Supabase.
- `supabase/` — migraciones, seed y Edge Functions.
- `assets/brand/` — logo, firma de la representante, iconos, splash y favicon.
- `context/` — documentación de trabajo; no se importa desde producción.
