import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorBanner } from '@/components/ui/error-banner';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionCard } from '@/components/ui/section-card';
import { StateView } from '@/components/ui/state-view';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import { formatPhoneInput } from '@/lib/format';

import { toBrandSettingsError } from '../brand-errors';
import {
  brandFormValuesToPayload,
  brandSettingsFormSchema,
  type BrandSettingsFormValues,
} from '../brand-schemas';
import {
  socialLinksFromJson,
  type BrandSettings,
} from '../brand-types';
import {
  useBrandSettings,
  useSaveBrandSettings,
} from '../use-brand-settings';

const DEFAULT_BUSINESS_NAME = 'Anggely Kids Shows y Eventos';

const DEFAULT_VALUES: BrandSettingsFormValues = {
  businessName: DEFAULT_BUSINESS_NAME,
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
};

function brandToFormValues(brand: BrandSettings | null): BrandSettingsFormValues {
  if (!brand) {
    return DEFAULT_VALUES;
  }

  const socialLinks = socialLinksFromJson(brand.social_links);

  return {
    businessName: brand.business_name,
    phone: formatPhoneInput(brand.phone),
    whatsapp: formatPhoneInput(brand.whatsapp),
    instagram: socialLinks.instagram ?? '',
    facebook: socialLinks.facebook ?? '',
    tiktok: socialLinks.tiktok ?? '',
  };
}

export function BrandSettingsForm() {
  const brandQuery = useBrandSettings();
  const saveMutation = useSaveBrandSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<BrandSettingsFormValues>({
    resolver: zodResolver(brandSettingsFormSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (brandQuery.data !== undefined) {
      reset(brandToFormValues(brandQuery.data));
    }
  }, [brandQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSaved(false);

    try {
      await saveMutation.mutateAsync(brandFormValuesToPayload(values));
      setSaved(true);
    } catch (error) {
      setSubmitError(toBrandSettingsError(error).message);
    }
  });

  if (brandQuery.isPending) {
    return (
      <SectionCard title="Datos de marca">
        <View className="items-center py-6">
          <ActivityIndicator color={colors.brand} size="large" />
          <AppText className="mt-3 text-label text-ink-muted">
            Cargando datos de marca...
          </AppText>
        </View>
      </SectionCard>
    );
  }

  if (brandQuery.isError) {
    return (
      <SectionCard title="Datos de marca">
        <StateView
          tone="error"
          title="No pudimos cargar los datos de marca"
          description={brandQuery.error.message}
          actionLabel="Reintentar"
          onAction={() => {
            void brandQuery.refetch();
          }}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Datos de marca"
      description="Se copian al confirmar un contrato y aparecen en el PDF.">
      <View className="gap-4">
        <Controller
          control={control}
          name="businessName"
          render={({ field, fieldState }) => (
            <TextField
              label="Nombre comercial"
              required
              placeholder={DEFAULT_BUSINESS_NAME}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <TextField
              label="Teléfono de contacto"
              required
              placeholder="999 999 999"
              keyboardType="phone-pad"
              value={field.value}
              onChangeText={(value) => field.onChange(formatPhoneInput(value))}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              hint="9 dígitos. Se agrega +51 automáticamente."
            />
          )}
        />

        <Controller
          control={control}
          name="whatsapp"
          render={({ field, fieldState }) => (
            <TextField
              label="WhatsApp"
              required
              placeholder="999 999 999"
              keyboardType="phone-pad"
              value={field.value}
              onChangeText={(value) => field.onChange(formatPhoneInput(value))}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              hint="9 dígitos. Se agrega +51 automáticamente."
            />
          )}
        />

        <View className="pt-2">
          <AppText className="text-label font-semibold text-ink">
            Redes sociales (opcional)
          </AppText>
          <AppText className="mt-1 text-label text-ink-muted">
            Puedes ingresar el enlace completo o el usuario.
          </AppText>
        </View>

        <Controller
          control={control}
          name="instagram"
          render={({ field, fieldState }) => (
            <TextField
              label="Instagram"
              placeholder="@anggelykids"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="facebook"
          render={({ field, fieldState }) => (
            <TextField
              label="Facebook"
              placeholder="@anggelykids"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="tiktok"
          render={({ field, fieldState }) => (
            <TextField
              label="TikTok"
              placeholder="@anggelykids"
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        {submitError ? <ErrorBanner message={submitError} /> : null}

        {saved && !isDirty ? (
          <AppText
            accessibilityLiveRegion="polite"
            className="text-label font-semibold text-success">
            Datos de marca guardados.
          </AppText>
        ) : null}

        <PrimaryButton
          label="Guardar datos de marca"
          loading={saveMutation.isPending}
          onPress={() => {
            void onSubmit();
          }}
        />
      </View>
    </SectionCard>
  );
}
