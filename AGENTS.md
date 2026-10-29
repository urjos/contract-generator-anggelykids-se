# Contexto de Construcción de la Aplicación

Este es un proyecto **Expo + React Native + TypeScript** (no Next.js). Antes de escribir código de plataforma, consulta la documentación instalada en `node_modules/` y la documentación oficial:

- `node_modules/expo/README.md` y `node_modules/expo-router/` para APIs de Expo Router.
- SDK 58 incluye React Native 0.88 y el **Strict TypeScript API** de RN 0.87: los deep imports de `react-native/Libraries/` son errores de tipo y los refs usan tipos de instancia. No asumas APIs de versiones anteriores.
- Revisa los avisos de deprecación antes de usar una API nueva.

## Contexto de Producto

Lee los siguientes archivos en orden antes de implementar o tomar cualquier decisión arquitectónica:

1. `context/project-overview.md` — definición del producto, objetivos, funcionalidades y alcance
2. `context/architecture.md` — estructura del sistema, límites, modelo de almacenamiento e invariantes
3. `context/ui-context.md` — tema, colores, tipografía, diseño del canvas y convenciones de componentes
4. `context/code-standards.md` — reglas y convenciones de implementación
5. `context/ai-workflow-rules.md` — flujo de trabajo de desarrollo, reglas de alcance y enfoque de entrega
6. `context/progress-tracker.md` — fase actual, trabajo completado, preguntas abiertas y siguientes pasos
7. `context/contract-template.md` — contrato, condiciones y firmas

Actualiza `context/progress-tracker.md` después de cada cambio significativo en la implementación.

Si la implementación modifica la arquitectura, el alcance o los estándares documentados en los archivos de contexto, actualiza el archivo correspondiente antes de continuar.

## Comandos

```bash
npm run start        # Metro / Expo dev server
npm run android      # abrir en dispositivo o emulador Android
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run export:android
```

En este entorno WSL, Node está instalado en `~/.local/node/bin`; añade ese directorio al `PATH` antes de ejecutar npm.
