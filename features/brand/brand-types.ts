import type { Json, Tables } from '@/types/database';

export type BrandSettings = Tables<'brand_settings'>;

export type BrandSocialLinks = Record<string, string>;

export type BrandSettingsPayload = {
  businessName: string;
  phone: string;
  whatsapp: string;
  socialLinks: BrandSocialLinks;
};

export const BRAND_SOCIAL_LINK_KEYS = ['instagram', 'facebook', 'tiktok'] as const;

export type BrandSocialLinkKey = (typeof BRAND_SOCIAL_LINK_KEYS)[number];

export function socialLinksFromJson(
  value: Json | null | undefined,
): BrandSocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}
