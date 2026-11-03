import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextButton } from '@/components/ui/text-button';
import { AuthErrorBanner } from '@/features/auth/components/auth-error-banner';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthSuccessBanner } from '@/features/auth/components/auth-success-banner';
import { toAuthOperationError } from '@/features/auth/auth-errors';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setSubmitError(toAuthOperationError(error).message);
    }
  });

  return (
    <AuthShell
      title="Recupera tu contraseña"
      description="Te enviaremos un enlace seguro para que puedas crear una nueva contraseña."
      footer={
        <TextButton label="Volver a iniciar sesión" onPress={() => router.replace('/(auth)/login')} />
      }>
      <View className="gap-4">
        {sent ? (
          <AuthSuccessBanner message="Si el correo está registrado, recibirás un enlace de recuperación. Ábrelo desde este dispositivo." />
        ) : null}
        {submitError ? <AuthErrorBanner message={submitError} /> : null}

        {!sent ? (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthFormField
                  label="Correo electrónico"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="send"
                  textContentType="emailAddress"
                  placeholder="correo@ejemplo.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={() => {
                    void onSubmit();
                  }}
                  error={errors.email?.message}
                />
              )}
            />

            <PrimaryButton
              className="mt-2"
              label="Enviar enlace"
              loading={isSubmitting}
              disabled={!isValid}
              onPress={() => {
                void onSubmit();
              }}
            />
          </>
        ) : null}
      </View>
    </AuthShell>
  );
}
