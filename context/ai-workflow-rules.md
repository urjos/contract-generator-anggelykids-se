# AI Workflow Rules

## Approach

Construir Anggely Kids Contratos incrementalmente y contra los archivos de `context/`. Cada unidad debe resolver un flujo pequeño, verificable y consistente con las decisiones de producto, seguridad y auditoría descritas aquí.

Antes de implementar una unidad, revisar `project-overview.md`, `architecture.md`, `code-standards.md` y `progress-tracker.md`. Resolver requisitos ambiguos en los archivos de contexto, no inventarlos dentro del código.

## Implementation Order

1. Inicializar Expo + TypeScript, NativeWind, `react-native-safe-area-context` y estructura de carpetas.
2. Configurar Supabase Auth para la cuenta propietaria única y políticas RLS mínimas.
3. Definir migraciones para clientes, eventos, contratos y auditoría.
4. Implementar inicio de sesión, recuperación de contraseña y navegación de la app.
5. Implementar listado/búsqueda de contratos.
6. Implementar formulario de cliente, evento y borrador de contrato.
7. Implementar detalle, estados e historial de auditoría.
8. Integrar la plantilla oficial y generación de documento.

## Scoping Rules

- Trabajar una unidad funcional a la vez.
- Preferir incrementos pequeños y verificables a cambios especulativos amplios.
- No combinar UI de contratos, cambios de esquema y generación de PDF, salvo que sea imprescindible para comprobar un flujo cerrado.
- Las migraciones y RLS son una unidad explícita y se revisan antes de conectar la UI que las consume.

## When to Split Work

Dividir una implementación si combina UI con cambios de esquema no verificados, varios dominios no relacionados o comportamiento que no está definido en los archivos de contexto.

If a change cannot be verified end to end quickly,
the scope is too broad — split it.

## Handling Missing Requirements

- No inventar cláusulas, campos legales, condiciones de pago o política de firma.
- Añadir una pregunta abierta en `progress-tracker.md` cuando afecte el esquema, autorización o flujo principal.
- Usar placeholders claramente marcados solo para contenido no legal de desarrollo.
- Mantener los textos contractuales fuera de componentes de UI, versionados junto a la plantilla.

## Protected Files

No modificar migraciones de Supabase ya aplicadas: crear una nueva migración. Los tipos generados de Supabase se regeneran, no se corrigen manualmente. La configuración generada de Expo/EAS solo cambia con una decisión documentada y compatible con EAS.

## Keeping Docs in Sync

Actualizar el archivo de contexto correspondiente cuando cambien el modelo de datos, acceso, infraestructura, alcance, flujo de usuario, convenciones o progreso.

## Before Moving to the Next Unit

1. El flujo de la unidad funciona dentro de su alcance.
2. Se respetan los invariantes de `architecture.md`.
3. Las validaciones, errores y estados de carga relevantes están cubiertos.
4. `progress-tracker.md` refleja el cambio y los requisitos pendientes.
5. Typecheck, lint y pruebas disponibles pasan.
