# UI Context

## Theme

Interfaz móvil cálida, ordenada y profesional: la energía festiva de Anggely Kids sin parecer infantil en tareas administrativas. Predominan superficies claras, buena jerarquía, tarjetas legibles y acentos coral y violeta. Debe facilitar completar datos de un contrato con rapidez y reducir errores en campo.

Modo inicial: claro. El modo oscuro queda para una fase posterior, construido sobre tokens semánticos.

## Colors

Los valores se implementarán como colores semánticos en la configuración de NativeWind/Tailwind, no como CSS variables en runtime. La fuente única es `theme/tokens.json`. Los estados siempre se acompañan de texto o icono; no se comunica estado solo con color.

| Role | Token | Value |
| --- | --- | --- |
| Fondo de aplicación | `canvas` | `#FFF9F7` |
| Superficie | `surface` | `#FFFFFF` |
| Superficie tenue | `surface-muted` | `#FFF0EB` |
| Texto principal | `ink` | `#2D1B2A` |
| Texto secundario | `ink-muted` | `#705D6A` |
| Marca principal | `brand` | `#E95270` |
| Marca oscura | `brand-strong` | `#C73657` |
| Acento | `accent` | `#7652C8` |
| Borde | `border` | `#E9D8E0` |
| Éxito | `success` | `#24805A` |
| Advertencia | `warning` | `#A56815` |
| Error | `danger` | `#B4233B` |

## Typography

| Role | Font | Usage |
| --- | --- | --- |
| UI | System / Inter si se incorpora | Formularios, datos y navegación |
| Headings | System / Inter SemiBold | Títulos y secciones |
| Contract document | Por definir según formato oficial | Previsualización y PDF |

- Cuerpo mínimo: 16 sp para campos y contenido importante.
- Etiquetas auxiliares: mínimo 12 sp, nunca como única explicación de una acción crítica.

## Border Radius

| Context | Class |
| --- | --- |
| Controles y campos | `rounded-xl` |
| Cards y secciones | `rounded-2xl` |
| Hojas modales | `rounded-t-3xl` |
| Pills / estados | `rounded-full` |

## Component Library

Componentes propios ligeros en `components/ui/`, construidos con React Native y NativeWind. Los componentes genéricos no contienen lógica de Supabase ni textos exclusivos de contratos.

## Layout Patterns

- **Lista:** cabecera, búsqueda/filtros y tarjetas de contrato con cliente, fecha, servicio, importe y estado.
- **Formulario:** pasos breves (cliente, evento, servicio/pago, revisión), indicador de progreso y guardado de borrador visible.
- **Detalle:** resumen de estado primero y secciones plegables para cliente, evento, pagos y auditoría.
- **Acciones críticas:** confirmar antes de cancelar o marcar como firmado; explicar si se bloquea la edición.
- Barra inferior inicial: `Inicio`, `Contratos`, `Crear`, `Clientes`, `Ajustes`.
- Las pantallas deben respetar los insets superior e inferior con `react-native-safe-area-context`; las barras inferiores, hojas modales y acciones fijas nunca quedan bajo la cámara, barra de estado o navegación del sistema.

## Icons

Usar `lucide-react-native`, iconos de trazo, normalmente 20 px en navegación/acciones y 16 px junto a estados o metadatos.

## Accessibility

- Áreas táctiles de al menos 44 × 44 pt.
- Etiquetas accesibles para iconos y campos obligatorios.
- Mensajes de validación próximos a su campo y anunciables por accesibilidad.
- Contraste mínimo WCAG AA para texto y controles.
