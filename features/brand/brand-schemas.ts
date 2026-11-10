import { z } from 'zod';

import { normalizePhoneE164 } from '@/lib/format';

import type { BrandSettingsPayload, BrandSocialLinks } from './brand-types';

const phoneInputSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el número de contacto.')
  .refine(
    (value) => normalizePhoneE164(value) !== null,
    'Ingresa un número de 9 dígitos, por ejemplo 999 999 999.',
  );

const socialLinkInputSchema = z
  .string()
  .trim()
  .max(200, 'El enlace es demasiado largo.')
  .optional();

export const brandSettingsFormSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre comercial.')
    .max(160, 'El nombre comercial es demasiado largo.'),
  phone: phoneInputSchema,
  whatsapp: phoneInputSchema,
  instagram: socialLinkInputSchema,
  facebook: socialLinkInputSchema,
  tiktok: socialLinkInputSchema,
});

export type BrandSettingsFormValues = z.infer<typeof brandSettingsFormSchema>;

export const brandSettingsPayloadSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  phone: z.string().regex(/^\+51\d{9}$/, 'Teléfono inválido.'),
  whatsapp: z.string().regex(/^\+51\d{9}$/, 'WhatsApp inválido.'),
  socialLinks: z
    .record(z.string(), z.string().trim().max(200))
    .default({}),
});

export function brandFormValuesToPayload(
  values: BrandSettingsFormValues,
): BrandSettingsPayload {
  const phone = normalizePhoneE164(values.phone);
  const whatsapp = normalizePhoneE164(values.whatsapp);

  if (!phone || !whatsapp) {
    throw new Error('invalid_input');
  }

  const socialLinks: BrandSocialLinks = {};
  for (const key of ['instagram', 'facebook', 'tiktok'] as const) {
    const value = values[key]?.trim();
    if (value) {
      socialLinks[key] = value;
    }
  }

  return {
    businessName: values.businessName.trim(),
    phone,
    whatsapp,
    socialLinks,
  };
}
