# Feature Spec 001 — Acceso de la cuenta propietaria

## Metadata

| Campo      | Valor                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| ID         | 001                                                                                                    |
| Estado     | Implementada y verificada en Android; pendiente redirect URL de recuperación en Supabase                |
| Fase       | 2 — Supabase Auth                                                                                      |
| Depende de | Unidad 1: scaffold Expo + NativeWind + navegación                                                      |
| Habilita   | Feature 002: modelo de datos, migraciones y RLS                                                        |
| Fecha      | 2026-10-29                                                                                             |
| Contexto   | `project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `contract-template.md` |

## 1. Problema

La app ya tiene la estructura visual y la navegación inferior, pero cualquier persona que abra el dispositivo puede entrar a las pantallas. Los contratos, clientes y documentos vivirán en Supabase y solo deben ser accesibles para la única cuenta propietaria de Anggely Kids. Sin autenticación no se puede proteger ningún dato ni auditar quién opera la app.

## 2. Objetivo

Implementar el acceso seguro de la cuenta propietaria única: inicio de sesión, sesión persistente, recuperación de contraseña, cierre de sesión y bloqueo de las rutas privadas. No existe registro abierto ni gestión de usuarios.

## 3. Alcance

### Incluye

- Cliente de Supabase con sesión persistida en `expo-secure-store`.
- Proveedor de sesión y hook de autenticación.
- Pantalla de inicio de sesión con email y contraseña.
- Pantalla de solicitud de recuperación de contraseña.
- Pantalla de establecimiento de nueva contraseña desde el deep link.
- Cierre de sesión desde Ajustes.
- Guardas de ruta: sin sesión solo se accede a las pantallas de auth; con sesión se accede a las pestañas.
- Manejo de estados de carga, error, reintento y expiración de sesión.
- Runbook de configuración del proyecto Supabase y de la cuenta propietaria.
- Variables de entorno documentadas y validadas al arrancar.

### No incluye

- Registro abierto, invitaciones, roles, perfiles ni administración de usuarios.
- OAuth, inicio con Google/Apple, biometría o MFA.
- Tablas de negocio, migraciones, RLS y Edge Functions (Feature 002 en adelante).
- Recuperación de datos, exportación o backups.
- Notificaciones push.
- Modo offline.

## 4. Decisiones aplicadas

- La cuenta propietaria se crea manualmente en el dashboard de Supabase; el registro está desactivado.
- Solo se usa el proyecto Supabase remoto del MVP; no se requiere Docker local.
- La sesión se guarda en SecureStore, nunca en AsyncStorage.
- La recuperación de contraseña usa el correo integrado de Supabase en el MVP; si la entrega no es fiable, se configura SMTP propio antes de producción.
- La zona horaria de la app es `America/Lima`, aunque esta feature no muestra fechas de negocio.
- El cliente móvil solo usa la `anon key`; la `service_role` nunca se incluye en la app ni en variables públicas de EAS.

## 5. Historias de usuario

1. Como responsable, al abrir la app sin sesión quiero ver el inicio de sesión para no exponer información.
2. Como responsable, quiero entrar con mi correo y contraseña para acceder a mis contratos.
3. Como responsable, quiero que mi sesión se mantenga al cerrar y reabrir la app para no escribir la contraseña cada vez.
4. Como responsable, quiero recuperar mi contraseña por correo si la olvido.
5. Como responsable, quiero cerrar sesión en un dispositivo para dejar de exponer mis datos.
6. Como responsable, quiero mensajes claros cuando la red falla o las credenciales son incorrectas.

## 6. Flujo de usuario

### Arranque

1. La app inicia y mantiene el splash visible mientras restaura la sesión.
2. Si hay sesión válida, entra a `/(tabs)` y oculta el splash.
3. Si no hay sesión, redirige a `/(auth)/login`.
4. Si la restauración falla por red, muestra un estado de error con reintento; no simula una sesión exitosa.

### Inicio de sesión

1. La responsable escribe email y contraseña.
2. Puede mostrar u ocultar la contraseña.
3. Al enviar, el botón se deshabilita y muestra carga.
4. Credenciales válidas: guarda la sesión y navega a `/(tabs)`.
5. Credenciales inválidas: muestra un mensaje genérico, sin revelar si el correo existe.
6. Error de red: muestra un mensaje con opción de reintentar.

### Recuperación de contraseña

1. Desde login, la responsable toca "Olvidé mi contraseña".
2. Ingresa su email y envía.
3. La app muestra siempre una confirmación neutral, exista o no la cuenta.
4. El correo incluye un enlace que abre `anggelykids://reset-password`.
5. La app intercambia el código de recuperación por una sesión temporal.
6. La responsable define y confirma una contraseña nueva.
7. Al guardar, se cierra la sesión temporal y se redirige al login con un mensaje de éxito.
8. Si el enlace es inválido o expiró, se muestra el error y un acceso para solicitar uno nuevo.

### Cierre de sesión

1. En Ajustes, la responsable toca "Cerrar sesión".
2. Se confirma la acción.
3. Se elimina la sesión local y se redirige a login.
4. Al reabrir la app no hay sesión activa.

## 7. Rutas y estructura

```text
app/
  _layout.tsx                    # providers, restauración de sesión y guardas
  (auth)/
    _layout.tsx                  # stack sin pestañas
    login.tsx
    forgot-password.tsx
    reset-password.tsx
  (tabs)/
    _layout.tsx                  # navegación privada existente
    index.tsx
    contracts.tsx
    create.tsx
    clients.tsx
    settings.tsx                 # agrega cierre de sesión

features/auth/
  auth-service.ts                # signIn, signOut, requestPasswordReset, updatePassword
  auth-provider.tsx              # sesión, estado, restauración con reintento y acciones
  use-auth.ts
  schemas.ts                     # Zod
  auth-errors.ts                 # traducción de errores de Supabase
  components/
    auth-shell.tsx
    auth-form-field.tsx
    auth-error-banner.tsx
    auth-success-banner.tsx
    supabase-config-error.tsx
    session-restore-error.tsx

lib/
  supabase.ts                    # cliente único con SecureStore
  secure-store.ts                # adaptador con chunking para Android
  env.ts                         # validación de variables públicas
```

- `app/_layout.tsx` envuelve la app con `SafeAreaProvider` y `AuthProvider`.
- Las guardas usan las rutas protegidas de Expo Router (`Stack.Protected`) o un redirect equivalente; no se permite renderizar `(tabs)` sin sesión.
- Durante la recuperación, el proveedor expone un estado `recovery` que mantiene accesible `reset-password` y evita que la sesión temporal redirija a `(tabs)`.
- Las pantallas son delgadas: validan con Zod, llaman a `useAuth` y muestran UI. No crean clientes de Supabase.

## 8. Requisitos funcionales

| ID    | Requisito                                                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Al arrancar, la app restaura la sesión desde SecureStore antes de decidir la ruta inicial.                                                                                  |
| FR-02 | Sin sesión, cualquier ruta privada redirige a `/(auth)/login`.                                                                                                              |
| FR-03 | Con sesión, las pantallas de auth redirigen a `/(tabs)`, salvo `reset-password` mientras el estado sea `recovery`.                                                          |
| FR-04 | El login valida email y contraseña con Zod antes de llamar a Supabase.                                                                                                      |
| FR-05 | Un login válido persiste la sesión y navega a Inicio.                                                                                                                       |
| FR-06 | Un login inválido muestra un error genérico y permite reintentar.                                                                                                           |
| FR-07 | La sesión se refresca al volver del background y se cierra si el refresh token ya no es válido.                                                                             |
| FR-08 | El cierre de sesión pide confirmación, limpia SecureStore y vuelve al login.                                                                                                |
| FR-09 | La solicitud de recuperación no revela si el correo existe.                                                                                                                 |
| FR-10 | El deep link de recuperación intercambia el código, mantiene el estado `recovery` (sin redirigir a tabs), permite definir una contraseña nueva y cierra la sesión temporal. |
| FR-11 | No existe ruta, botón ni enlace de registro.                                                                                                                                |
| FR-12 | Los errores de red y de rate limit se muestran con texto claro y opción de reintento.                                                                                       |
| FR-13 | Los campos tienen etiquetas accesibles, foco visible y áreas táctiles de al menos 44 × 44 pt.                                                                               |
| FR-14 | No se registran tokens, contraseñas, correos completos ni URLs firmadas en logs.                                                                                            |

## 9. Validaciones

- Email: obligatorio, formato válido, se recorta y se convierte a minúsculas.
- Contraseña de login: obligatoria, mínimo 8 caracteres.
- Nueva contraseña: mínimo 8 caracteres y confirmación idéntica.
- Mensajes de validación junto al campo y anunciados por accesibilidad.
- El botón de envío se deshabilita mientras hay una petición en curso.
- Los mensajes de Supabase se traducen a textos de producto; no se muestran mensajes técnicos crudos.

## 10. Diseño técnico

### Dependencias

- `@supabase/supabase-js`
- `expo-secure-store`
- `react-native-url-polyfill`
- `zod`
- `react-hook-form`
- `@hookform/resolvers`

### Variables de entorno

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

- Se validan al arrancar en `lib/env.ts`; si faltan, la app muestra un error de configuración en desarrollo y no intenta autenticar.
- `.env.local` no se versiona. Se documenta una plantilla `.env.example` sin valores reales.
- Las mismas variables se configuran en EAS para los perfiles de desarrollo, preview y producción.

### Cliente Supabase

```ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
```

- En web de desarrollo se puede usar un adaptador `localStorage` marcado como no productivo; Android es la plataforma objetivo.
- En Android, SecureStore tiene un límite de tamaño por valor. El adaptador divide la sesión en chunks con claves estables y la reconstruye al leer; si un chunk falta o está corrupto, se trata como sesión inválida.
- `lib/supabase.ts` es el único lugar donde se crea el cliente.

### Proveedor de sesión

- `AuthProvider` mantiene `session`, `status` (`loading` | `authenticated` | `unauthenticated` | `recovery` | `error` | `unconfigured`), `restoreError` y las acciones `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `beginPasswordRecovery`, `retrySessionRestore`.
- Si la restauración falla por red, pasa a `error` y expone un reintento explícito; una sesión revocada pasa a `unauthenticated`.
- Se suscribe a `supabase.auth.onAuthStateChange`.
- En `AppState` activo, llama a `supabase.auth.startAutoRefresh()` y al pasar a background, `stopAutoRefresh()`.
- El estado de auth no se duplica en Zustand.

### Deep link de recuperación

- `requestPasswordReset` usa `redirectTo: Linking.createURL('reset-password')` (sin slash inicial para evitar `anggelykids:///reset-password`).
- La URL `anggelykids://reset-password` debe estar en la allowlist de Supabase Auth.
- `reset-password.tsx` detecta el parámetro `code`, llama a `supabase.auth.exchangeCodeForSession(code)` y muestra el formulario.
- Al iniciar el intercambio, el proveedor pasa a `recovery`; la guarda no redirige a `(tabs)` aunque exista sesión temporal.
- Si no hay código o el intercambio falla, muestra un estado de enlace inválido con acceso a solicitar otro.
- Tras `updateUser({ password })`, se ejecuta `signOut()`, se limpia el estado `recovery` y se navega a login con confirmación.

## 11. Configuración de Supabase (runbook)

1. Crear el proyecto remoto de Supabase del MVP.
2. En Authentication > Providers > Email, desactivar "Allow new users to sign up".
3. Crear manualmente la cuenta propietaria con el correo de Anggely Kids y marcarla como confirmada.
4. En Authentication > URL Configuration, agregar:
   - `anggelykids://reset-password`
   - La URL de desarrollo que genere Expo (`exp://` o la del development build).
5. Revisar las plantillas de correo de recuperación y confirmar que el enlace use la redirect URL configurada.
6. Copiar `Project URL` y `anon public key` a `.env.local` y a EAS.
7. Verificar que la `service_role` no esté en ningún archivo del cliente ni en variables `EXPO_PUBLIC_*`.
8. Probar login, logout y recuperación en un development build de Android.

## 12. Criterios de aceptación

1. En una instalación limpia, la app abre login y no muestra las pestañas.
2. Un login con credenciales correctas entra a Inicio.
3. Un login con credenciales incorrectas muestra un error genérico y no navega.
4. Cerrar y reabrir la app conserva la sesión.
5. Cerrar sesión vuelve a login y una reapertura sigue sin sesión.
6. "Olvidé mi contraseña" envía el correo y muestra una confirmación neutral.
7. El enlace del correo abre la app, permite definir una contraseña nueva y luego exige iniciar sesión.
8. Un enlace inválido o expirado muestra error y opción de solicitar otro.
9. Una sesión expirada o revocada redirige a login sin dejar rutas privadas accesibles.
10. No se puede acceder a `/(tabs)` ni por navegación ni por deep link sin sesión.
11. No existe registro abierto ni ruta de signup.
12. La app maneja error de red y rate limit con mensajes claros y reintento.
13. `npm run typecheck` y `npm run lint` pasan.
14. El flujo se verificó en Android con teclado abierto, pantalla pequeña y áreas seguras.

## 13. Plan de pruebas

### Manuales

- Instalación limpia sin sesión.
- Login válido, inválido y con campos vacíos.
- Persistencia tras matar y reabrir la app.
- Logout y reapertura.
- Recuperación con correo existente y con correo inexistente (misma respuesta).
- Deep link válido, expirado y manipulado.
- Modo avión durante login y recuperación.
- Sesión revocada desde el dashboard de Supabase.
- Navegación por deep link a `/(tabs)` sin sesión.
- Accesibilidad: lector de pantalla, tamaños de texto grandes, foco y teclado.
- Android: botón atrás desde login no entra a las pestañas.

### Automatizadas

- Pruebas unitarias de los schemas Zod (email, contraseña y confirmación) con el runner que se configure en esta feature o en la siguiente.
- Verificación estática de que `lib/supabase.ts` no expone la `service_role` y de que las variables faltantes fallan de forma controlada.
- Typecheck y lint en CI local antes de cerrar la feature.

## 14. Seguridad y privacidad

- Tokens solo en SecureStore; nunca en logs, analytics ni mensajes de error.
- La app no incluye `service_role` ni claves de servidor.
- La allowlist de redirect URLs de Supabase limita los deep links aceptados.
- Los mensajes de auth no revelan si un correo está registrado.
- No se captura PII en logs; los errores se registran con códigos, no con contenido de formularios.
- El registro abierto permanece desactivado también en producción.

## 15. Riesgos y mitigaciones

| Riesgo                                                     | Mitigación                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| El correo integrado de Supabase no entrega la recuperación | Probar temprano; configurar SMTP propio antes de producción si falla.                       |
| El deep link no abre la app en Android                     | Usar development build, verificar intent filters y la allowlist de Supabase.                |
| SecureStore no está disponible en web                      | Web no es plataforma objetivo; adaptador de desarrollo explícitamente no productivo.        |
| La sesión supera el límite de SecureStore en Android       | Adaptador con chunking y reconstrucción; probar con un JWT real antes de cerrar la feature. |
| El proyecto está en una ruta con OneDrive                  | Mantener el repositorio en `C:\Projects\Android`, fuera de OneDrive.                        |
| Sesión revocada mientras la app está abierta               | Escuchar `onAuthStateChange` y redirigir a login.                                           |
| Fuga de claves en variables públicas                       | Revisar `.env.local`, EAS y el bundle; solo `anon key` en el cliente.                       |

## 16. Observabilidad

- Sin analytics en el MVP.
- Errores de auth con códigos internos y mensajes de producto.
- Los logs de Supabase Auth son la fuente para diagnosticar rate limits y correos.
- No se registran correos completos, tokens ni contraseñas.

## 17. Definición de terminado

- Todos los criterios de aceptación se cumplen en Android.
- `npm run typecheck` y `npm run lint` pasan.
- El runbook de Supabase está ejecutado y documentado sin secretos.
- `progress-tracker.md` actualizado con el resultado y los pendientes.
- `architecture.md` y `code-standards.md` reflejan cualquier ajuste surgido durante la implementación.
- No se agregaron tablas ni RLS en esta feature; eso queda para la Feature 002.

## 18. Checklist de implementación

- [x] Instalar dependencias de auth y validación.
- [x] Crear `.env.example` con placeholders.
- [x] Validar variables en `lib/env.ts`.
- [x] Crear `lib/supabase.ts` con SecureStore y PKCE.
- [x] Crear `lib/secure-store.ts` con chunking y fallback web de desarrollo.
- [x] Crear schemas Zod de login, recuperación y nueva contraseña.
- [x] Crear `auth-service.ts`, `AuthProvider` y manejo de errores traducidos.
- [x] Implementar `(auth)/login.tsx`.
- [x] Implementar `(auth)/forgot-password.tsx`.
- [x] Implementar `(auth)/reset-password.tsx` con deep link.
- [x] Proteger `(tabs)` y redirigir según sesión.
- [x] Agregar restauración con estado de error y reintento.
- [x] Agregar cierre de sesión con confirmación en Ajustes.
- [x] Verificar `npm run typecheck`, `npm run lint` y `npm run export:android`.
- [x] Configurar `.env.local` y la cuenta propietaria en Supabase.
- [ ] Confirmar `anggelykids://reset-password` en las redirect URLs del proyecto Supabase remoto.
- [x] Probar login, persistencia y logout en Android.
- [x] Actualizar `progress-tracker.md`.

## 19. Siguiente feature

Feature 002: modelo de datos inicial y RLS — creada en `context/feature-specs/002-modelo-datos-inicial-rls.md`. Incluye migraciones de `clients`, `events`, `service_catalog`, `contracts`, `contract_payments`, `contract_templates`, `contract_documents`, `contract_audit_log`, `contract_counters` y `brand_settings`, con políticas para `auth.uid()` y pruebas de acceso denegado sin sesión.
