# Contract Template Context

## Source and Intent

Esta especificación proviene del formato físico de Anggely Kids Shows y Eventos entregado como referencia el 28 de octubre de 2026. La aplicación debe generar un documento digital que conserve la estructura comercial de este formato, pero no intenta reproducir su arte gráfico como imagen de fondo.

El PDF final debe usar una plantilla digital versionada con marca Anggely Kids, número de contrato visible y campos legibles. Esto evita que un cambio visual o de condiciones modifique contratos ya confirmados.

## Contract Header

| Field | Key | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| Número de contrato | `contract_number` | Texto generado | Sí, al confirmar | Serie independiente de 5 dígitos, `N° 00001`, sin prefijo de año. Se asigna una sola vez al confirmar y no se reutiliza. |
| Cliente | `client.full_name` | Texto | Sí | Corresponde a `Sr(a)` en el formato actual. |
| Celular | `client.phone` | Teléfono | Sí | Validar formato peruano sin impedir un prefijo internacional. |
| Lugar de presentación | `event.venue_address` | Texto largo | Sí | Dirección y referencias necesarias para el evento. |

## Service and Event Fields

| Field | Key | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| Descripción | `contract.description` | Texto largo | Sí | Resume paquete, personajes, duración y adicionales acordados. No se limita al nombre del paquete. |
| Día de presentación | `event.starts_at` | Fecha | Sí | Se muestra en formato largo español. |
| Hora | `event.starts_at` | Hora | Sí | Pertenece al mismo inicio del evento. |
| Monto acordado | `contract.total_amount_cents` | Moneda PEN | Sí | Importe total, almacenado en céntimos. Incluye movilidad cuando corresponde. |
| A cuenta | Derivado | Moneda PEN | Sí | Suma de pagos con `kind = deposit`; puede ser cero. |
| Saldo | Derivado | Moneda PEN | Sí | `monto acordado − suma de pagos`; nunca se edita directamente. |

## Optional Operational Notes

El contrato de ejemplo incluye anotaciones manuscritas fuera de los campos impresos, por ejemplo duración, número de niños, local y medidas/restricciones. Para no perder esa información, el formulario tendrá:

- `event.guest_count` — número de niños o asistentes, opcional.
- `event.venue_name` — nombre del local, opcional.
- `contract.internal_notes` — notas solo para operación, no necesariamente impresas.
- `contract.client_visible_notes` — indicaciones acordadas que sí deben aparecer en el documento.

La selección de paquete debe llenar la descripción como punto de partida, pero la responsable puede ajustarla antes de confirmar el contrato.

## Conditions and Signatures

Las siguientes condiciones del formato físico se conservan sin cambios para la primera versión:

> Nota: La movilidad corre por cuenta del cliente (ida y vuelta).
>
> * En caso de suspensión o cancelación la productora no se hace responsable por el cambio de fecha ni por el dinero adelantado.
>
> * Estando ambas partes de acuerdo para mayor constancia pasan a firmar.

La página pública también indica que los paquetes no incluyen movilidad y que el traslado se cotiza según el distrito. Las condiciones se guardarán en `contract.template_snapshot` como contenido versionado y aparecerán en el PDF confirmado. No deben quedar hardcodeadas en la interfaz.

El documento conserva dos espacios: `Firma Cliente` y `Firma Representante`.

- La firma del cliente se registra en el MVP como confirmación manual con fecha y nombre de quien confirma; no se captura evidencia gráfica. Las columnas de evidencia (`signature_storage_path`) existen desde la primera migración como nullable, de modo que añadir firma dibujada o una PNG no requiera reescribir el esquema.
- La firma de la representante se incorpora como PNG estático desde `assets/brand/signature.png` (o desde `brand_settings.signature_storage_path` cuando se configure en producción). Es un activo de marca, no evidencia de firma del cliente.

## Mobility

- La condición general se imprime siempre en el contrato.
- `contract.mobility_amount_cents` es un desglose informativo del cargo por traslado cotizado según el distrito.
- `contract.total_amount_cents` ya incluye la movilidad cuando existe; el PDF imprime `Total S/ X (incluye movilidad S/ Y)` para evitar duplicar el importe.
- El saldo se calcula sobre el total, que ya contiene la movilidad.

## Brand and Contact Block

Todo PDF confirmado muestra siempre el bloque de marca de Anggely Kids:

- Logo oficial en PNG (`assets/brand/logo.png`; en producción, `brand_settings.logo_storage_path`).
- Firma de la representante en PNG (`assets/brand/signature.png`; en producción, `brand_settings.signature_storage_path`).
- Nombre comercial: `Anggely Kids Shows y Eventos`.
- Teléfono/WhatsApp vigente.
- Enlaces o identificadores vigentes de redes sociales.

Estos datos se administran en Ajustes como configuración de marca (`brand_settings`) y se copian al snapshot del contrato al confirmarlo. De esta forma, los contratos históricos conservan los datos de contacto que tenían cuando fueron emitidos. La generación del PDF se bloquea si falta el logo, la firma de la representante o los datos de contacto obligatorios.

## Typography

- Cuerpo del contrato: `Times-Roman` estándar del PDF.
- Títulos y etiquetas del documento: `Helvetica-Bold` estándar del PDF.
- Previsualización en la app: fuente serif del sistema.
- No se embeben fuentes personalizadas en el MVP; la identidad visual se apoya en logo, firma y colores de marca.

## Package Catalog Seed

La página pública presenta las categorías `Shows Clásicos y Temáticos`, `Especial Huntrix`, `Sensorial & Estimulación` y `Paquetes Navideños`. El catálogo inicial no debe replicar precios de forma permanente desde la web: la responsable podrá crear, modificar, activar o desactivar paquetes y precios desde Ajustes.

Como datos de referencia, los paquetes clásicos visibles son: Básico (S/ 250), Mi Fiesta (S/ 399), Super Fiesta (S/ 559), Mega Fiesta (S/ 699), Fiesta Premium (S/ 899) y Mega Fiesta Premium (S/ 1299). El precio elegido se copia al contrato como snapshot y luego puede editarse sin modificar el catálogo.

Fuente: [paquetes de Anggely Kids](https://anggelykids-landingpage.vercel.app/paquetes), consultada el 28 de octubre de 2026.

## Resolved Questions

- La numeración digital es una nueva serie independiente de 5 dígitos (`N° 00001`), sin prefijo de año, asignada al confirmar y sin huecos.
- Se conserva literalmente el texto actual de condiciones hasta que Anggely Kids indique una modificación; cualquier cambio crea una nueva versión de plantilla.
- La movilidad se imprime como condición y se desglosa dentro del total, no se suma aparte.
- Todo PDF incluye logo, firma de la representante y datos de contacto/redes vigentes de la marca.
- Los pagos se registran en `contract_payments`; "a cuenta" y saldo son derivados.
- La firma del cliente en el MVP es confirmación manual con fecha; la evidencia gráfica queda como columna nullable.
- La firma de la representante se usa como PNG estático.
- El PDF se genera en una Edge Function y se ofrece descarga y compartir por WhatsApp.
- El documento usa fuentes estándar del PDF en el MVP.

## External Dependencies

- Confirmación legal del texto de condiciones.
- Logo y firma de la representante oficiales para reemplazar los placeholders de `assets/brand/`.
- Teléfonos y redes sociales definitivos para el bloque de marca.
