# [Nombre de la Funcionalidad / Feature]

[Descripción breve en 1-2 líneas del objetivo de la funcionalidad, qué problema resuelve o qué comportamiento introduce desde la perspectiva del usuario/sistema].

---

## Implementación

1. **[Paso Principal o Archivo/Módulo Clave]** (ej. `src/components/...` o `src/services/...`):

   **Antes de implementar:**
   - Revisar `context/project-overview.md` y `context/architecture.md` para validar las reglas de producto y del sistema.
   - Consultar `context/ui-context.md` y `context/code-standards.md` para seguir el diseño y las convenciones de código establecidas.
   - Reutilizar patrones, utilidades y componentes ya existentes en el proyecto en lugar de crear nuevas abstracciones redundantes.

   **Tareas a implementar:**
   - [Acción o sub-tarea concreta 1]
   - [Acción o sub-tarea concreta 2]
   - [Acción o sub-tarea concreta 3]
   - Asegurar el cumplimiento de:
     - [Regla de diseño / paleta / espaciado / validaciones específicas]
     - [Manejo de estados: carga, éxito, error]
   - Manejar errores de forma adecuada sin romper la experiencia del usuario o el estado de la aplicación.

---

## Dependencias

- **Paquetes / Librerías:** [Indicar si ya están instaladas o si se requiere instalar alguna nueva].
- **Variables de Entorno / Claves:** [Indicar variables necesarias en `.env.local` o si no requiere nuevas].

---

## Límites de Alcance (Scope Limits)

- No modificar la arquitectura global ni los límites definidos en `context/architecture.md`.
- No introducir librerías de estado externas o dependencias innecesarias fuera de las acordadas.
- No modificar código ni componentes fuera del alcance de esta funcionalidad sin previa validación.

---

## Verificación al Finalizar (Check When Done)

- [ ] La funcionalidad cumple con el comportamiento esperado descrito.
- [ ] La UI respeta la paleta de colores, tipografías y estándares de `context/ui-context.md`.
- [ ] Los casos de error y estados vacíos se manejan limpiamente.
- [ ] No hay advertencias ni errores en consola.
- [ ] Se ejecutó y pasó `npm run build` (o linter/tests correspondientes).
- [ ] Se actualizó `context/progress-tracker.md` con los avances realizados.
