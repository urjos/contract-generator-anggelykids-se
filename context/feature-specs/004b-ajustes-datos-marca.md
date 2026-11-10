# Feature 004b — Ajustes: datos de marca

| Campo      | Valor                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Estado     | Implementada, migración aplicada y verificada en Android                |
| Fase       | 4 — Operaciones de contratos                                          |
| Depende de | Features 001, 002 y 003                                               |

## 1. Contexto

`confirm_contract` exige una fila de `brand_settings` para el propietario porque copia la marca al `template_snapshot` del contrato. El seed crea la plantilla y el catálogo, pero no la configuración de marca, y la app no tenía pantalla para editarla. Al confirmar un borrador aparecía `contract_brand_unavailable`.

## 2. Objetivo

Permitir que la responsable complete y actualice los datos de marca desde `Ajustes` sin usar SQL, y desbloquear la confirmación de contratos.

## 3. Alcance

Incluye:

- Migración para permitir `insert` y `update` de `brand_settings` a `authenticated`, manteniendo las políticas RLS existentes.
- Servicio y validación para leer y guardar la fila única del propietario.
- Formulario en `Ajustes` con nombre comercial, teléfono, WhatsApp e Instagram, Facebook y TikTok opcionales.
- Normalización de teléfonos a `+51` con exactamente 9 dígitos.
- Mensaje de confirmación que indica completar la marca en `Ajustes`.

No incluye:

- Subida de logo o firma a Storage; quedan como columnas nullable para la generación del PDF.
- Edición de plantillas o catálogo.
- Cambios de esquema más allá de los grants.

## 4. Decisiones

### 4.1 Persistencia

- La fila sigue siendo única (`id = 1`, `owner_id` único) y se identifica por `owner_id`.
- Si no existe, el servicio inserta con `id = 1`; si existe, actualiza solo `business_name`, `phone`, `whatsapp` y `social_links`.
- `social_links` guarda solo claves no vacías entre `instagram`, `facebook` y `tiktok`.

### 4.2 Validación

- `business_name`: 2 a 160 caracteres.
- `phone` y `whatsapp`: 9 dígitos nacionales, con prefijo `+51` opcional; se guardan como `+51XXXXXXXXX`.
- Redes: texto libre de hasta 200 caracteres; se aceptan enlaces o usuarios.

### 4.3 Estado remoto

- TanStack Query usa la clave `['brand', 'settings']`.
- Guardar actualiza la caché con la fila devuelta por Supabase.
- Confirmar un contrato no necesita invalidar esta caché porque la RPC lee la marca directamente en el servidor.

## 5. Archivos

- `supabase/migrations/20261103000900_brand_settings_writes.sql`
- `features/brand/brand-types.ts`
- `features/brand/brand-schemas.ts`
- `features/brand/brand-errors.ts`
- `features/brand/brand-service.ts`
- `features/brand/use-brand-settings.ts`
- `features/brand/components/brand-settings-form.tsx`
- `app/(tabs)/settings.tsx`
- `features/contracts/contract-errors.ts`

## 6. Criterios de aceptación

1. Con la sesión activa, `Ajustes` muestra la sección `Datos de marca`.
2. Guardar nombre, teléfono y WhatsApp crea la fila si no existe o la actualiza si existe.
3. Los teléfonos con más o menos de 9 dígitos se rechazan en el formulario.
4. Los datos persisten al salir y volver a `Ajustes`.
5. Un borrador se confirma correctamente después de guardar la marca.
6. Si se borra la marca, la confirmación vuelve a mostrar el error con la indicación a `Ajustes`.

## 7. Verificación

- `npm run typecheck`
- `npm run lint`
- `npm run export:android`
- `npm run db:push:remote:dry` y `npm run db:push:remote`
- Prueba manual en Android completada.
