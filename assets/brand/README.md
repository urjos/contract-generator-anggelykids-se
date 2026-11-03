# Activos de marca — Anggely Kids

Carpeta única para las imágenes de la app y del PDF. Los archivos actuales son **placeholders de desarrollo** generados con los colores de `theme/tokens.json`; deben sustituirse por los oficiales antes de producción conservando nombres, proporciones y transparencia.

## Archivos

| Archivo | Tamaño | Fondo | Uso |
| --- | --- | --- | --- |
| `logo.png` | 1600 × 800 | Transparente | Wordmark para el PDF y materiales de marca. |
| `logo-icon.png` | 1024 × 1024 | Transparente | Marca cuadrada para usos internos y previsualizaciones. |
| `signature.png` | 1600 × 600 | Transparente | Firma de la representante para el PDF. No es evidencia de firma del cliente. |
| `app-icon.png` | 1024 × 1024 | Opaco (`canvas`) | Icono principal de la app (iOS/Android). |
| `adaptive-icon-foreground.png` | 1024 × 1024 | Transparente | Capa frontal del icono adaptativo de Android. |
| `adaptive-icon-background.png` | 1024 × 1024 | Opaco (`canvas`) | Capa de fondo del icono adaptativo. |
| `adaptive-icon-monochrome.png` | 1024 × 1024 | Transparente | Silueta para el icono temático de Android. |
| `splash-icon.png` | 1024 × 1024 | Transparente | Imagen del splash screen. |
| `favicon.png` | 48 × 48 | Opaco (`canvas`) | Favicon web. |

`app.json` ya referencia estos archivos. No moverlos ni renombrarlos sin actualizar `app.json` y este documento.

## Reglas de reemplazo

### Logo

- Mantener PNG con transparencia real, sin fondo blanco incrustado.
- Dejar un margen transparente mínimo del 8 % alrededor del wordmark.
- Conservar la proporción 2:1 de `logo.png`; si el logo oficial tiene otra proporción, actualizar este README y las medidas de uso en el PDF.
- Usar la versión de color sobre fondos claros. Si existe una versión monocromática, agregarla como `logo-mono.png`.

### Firma de la representante

- PNG transparente, sin fondo, sin sombra y sin texto adicional.
- Trazo oscuro (`ink`) para que se imprima bien en blanco y negro.
- Conservar la proporción 8:3 de `signature.png`.
- La firma oficial reemplaza el placeholder manteniendo el mismo nombre.
- En producción, la firma también puede administrarse desde `brand_settings.signature_storage_path`; el archivo local es el fallback de desarrollo.

### Iconos y splash

- `app-icon.png` no debe tener transparencia (iOS la rechaza).
- El foreground adaptativo debe mantener la marca dentro del 66 % central; el resto puede quedar transparente.
- El monochrome debe ser una silueta de un solo color sobre transparente.
- El splash usa la marca centrada; `app.json` controla `imageWidth`.

## Uso en la app y en el PDF

- La app puede usar estos archivos para iconos, splash y previsualizaciones locales.
- La Edge Function que genera el PDF no lee `assets/brand/`; usa los archivos subidos a Supabase Storage y referenciados por `brand_settings.logo_storage_path` y `brand_settings.signature_storage_path`.
- Los archivos locales son la fuente para subir los oficiales a Storage y el fallback de desarrollo.

## Datos que no van en imágenes

- Teléfonos, WhatsApp y redes sociales se administran en `brand_settings` y se copian al snapshot del contrato. No hardcodearlos en componentes ni en las imágenes.
- El nombre comercial impreso es `Anggely Kids Shows y Eventos`.

## Pendientes externos

- Logo oficial en PNG.
- Firma oficial de la representante en PNG.
- Confirmación de la versión de color y de la versión monocromática del logo.
