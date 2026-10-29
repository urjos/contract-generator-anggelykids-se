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

## Contracts and Storage

- Enviar mutaciones de contratos mediante casos de uso de `features/contracts`, no desde componentes genéricos.
- Tratar `firmado` como estado inmutable y registrar transiciones en la bitácora.
- Los documentos pertenecen a Storage; los metadatos y snapshots a PostgreSQL.

## File Organization

- `app/` — rutas y layouts de Expo Router.
- `components/ui/` — controles visuales reutilizables.
- `features/<domain>/` — pantallas compuestas, hooks, schemas, servicios y pruebas de un dominio.
- `lib/` — infraestructura compartida sin UI.
- `stores/` — estado local de aplicación.
- `types/` — tipos comunes y tipos generados desde Supabase.
- `supabase/` — migraciones, seed y Edge Functions.
- `context/` — documentación de trabajo; no se importa desde producción.
