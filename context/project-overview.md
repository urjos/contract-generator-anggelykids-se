# Anggely Kids Contratos

## Overview

Aplicación móvil interna para Anggely Kids Show y Eventos. Centraliza la creación, consulta y auditoría de contratos para shows infantiles, shows privados, horas locas y servicios relacionados. Sustituye el registro manual disperso por contratos versionados, trazables y vinculados a cada cliente y evento.

La primera versión es para una única persona responsable de la operación; no es un portal público para clientes ni una herramienta multiusuario.

## Goals

1. Registrar un contrato completo de un evento desde un teléfono, sin rehacer el formato de la empresa manualmente.
2. Mantener una fuente de verdad auditable: quién creó o modificó cada contrato y cuándo.
3. Encontrar contratos por cliente, fecha, tipo de servicio o estado en pocos pasos.
4. Generar una versión lista para compartir o imprimir a partir del contrato aprobado.

## Core User Flow

1. La responsable abre la app.
2. En el inicio ve contratos recientes, próximos eventos y accesos para crear o buscar.
3. Selecciona **Nuevo contrato** y elige un servicio (show infantil, show privado, hora loca u otro).
4. Completa los datos del cliente, evento, servicio, importe, adelanto y cláusulas aplicables.
5. La app valida los datos obligatorios y guarda el contrato como borrador en Supabase.
6. La responsable revisa una previsualización basada en la plantilla oficial y confirma el contrato.
7. El contrato pasa a `pendiente_de_firma`; se registra el cambio en el historial y se genera el documento para compartir.
8. Cuando se confirme la firma o aceptación, lo marca como `firmado`; el contrato conserva su versión y auditoría.
9. Puede localizarlo después mediante búsqueda y filtros, y consultar su historial.

## Features

### Contratos

- Crear contratos desde una plantilla de servicios y cláusulas.
- Capturar los campos del formato real: cliente, celular, dirección, descripción, fecha/hora, monto, adelanto y saldo.
- Registrar pagos y abonos como movimientos append-only; "a cuenta" y saldo se calculan.
- Guardar borradores y reanudarlos.
- Ver detalle, estado, importes y una previsualización del documento.
- Duplicar un contrato como base para un nuevo evento.
- Anular un contrato firmado con motivo y crear un reemplazo enlazado.
- Generar un documento compartible a partir de la versión confirmada, con descarga y envío por WhatsApp.
- Mantener un historial de cambios y transiciones de estado.

### Clientes y eventos

- Reutilizar clientes existentes o registrar uno nuevo al crear un contrato.
- Guardar fecha, hora, dirección, distrito/ciudad, tipo de evento y observaciones.
- Consultar próximos eventos desde el detalle del contrato.

### Consulta y control

- Buscar por número de contrato, nombre, teléfono o fecha.
- Filtrar por estado, servicio y rango de fechas.
- Mostrar importes acordados, adelantos y saldo pendiente.
- Registrar movilidad como cargo opcional y mostrarla separadamente cuando corresponda.

### Catálogo de paquetes

- Ofrecer como punto de partida las categorías Clásicos/Temáticos, Huntrix, Sensorial/Estimulación y Navideños.
- Copiar al contrato el precio y la descripción acordados como snapshot; cambios posteriores en el catálogo no alteran contratos existentes.

### Operación individual

- Una única responsable crea, modifica y consulta los contratos.
- Una única cuenta propietaria permite recuperar los datos al reinstalar la app o usar otro dispositivo.
- Sin roles, invitaciones, registro abierto ni pantallas de administración de usuarios.

## Scope

### In Scope

- Aplicación React Native para Android primero, preparada para iOS.
- Inicio de sesión y recuperación de contraseña para la única cuenta propietaria.
- Gestión de clientes, eventos y contratos.
- Flujo de borrador a contrato firmado con bitácora.
- Consulta, filtros y generación de documento basado en una plantilla aprobada.
- PDF con logo y bloque de contacto/redes vigente de Anggely Kids.

### Out of Scope

- Cobros en línea, facturación electrónica o integración contable.
- Portal de clientes.
- Firma electrónica con validez legal avanzada; inicialmente se registra la confirmación de firma.
- Calendario operativo, asignación de animadores y gestión de inventario.
- Modo offline completo y sincronización de conflictos.

## Success Criteria

1. La responsable puede crear, guardar y reabrir un contrato de evento.
2. Cada contrato tiene identificador, estado, fechas de creación/actualización e historial de cambios.
3. La responsable puede encontrar un contrato por cliente o fecha y revisar sus datos sin depender de archivos físicos.
4. Los datos del negocio no quedan expuestos públicamente desde Supabase.
5. La plantilla oficial se puede transformar en un contrato listo para compartir sin alterar el registro original.

## Contract Lifecycle

`borrador` → `pendiente_de_firma` → `firmado`

Estados alternativos: `cancelado`, `anulado` y `archivado`. Un contrato firmado no se edita directamente: se anula con motivo y fecha, y se crea un contrato de reemplazo como borrador enlazado al original. El número de contrato no se reutiliza.

## Product Assumptions to Validate

- La empresa entregará su formato actual de contrato y las cláusulas que no deben cambiar.
- El formato físico recibido se convirtió en la especificación de campos de `contract-template.md`; el texto legal requiere confirmación antes de publicarse.
- El monto se manejará en soles peruanos (PEN).
- La firma del MVP es una confirmación manual con fecha; la captura de una firma en PNG queda para una fase posterior.
- La app se usará en varios dispositivos; los conflictos de edición se resolverán por bloqueo optimista.
