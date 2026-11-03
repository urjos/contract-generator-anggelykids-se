import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, type TextInputInstance } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextButton } from '@/components/ui/text-button';
import { AuthErrorBanner } from '@/features/auth/components/auth-error-banner';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthSuccessBanner } from '@/features/auth/components/auth-success-banner';
import { toAuthOperationError } from '@/features/auth/auth-errors';
import { loginSchema, type LoginValues } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';

export default function LoginScreen() {
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { signIn, passwordResetCompleted, clearPasswordResetCompleted } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showResetSuccess] = useState(reset === 'success' || passwordResetCompleted);

  useEffect(() => {
    if (passwordResetCompleted) {
      clearPasswordResetCompleted();
    }
  }, [passwordResetCompleted, clearPasswordResetCompleted]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await signIn(values);
      router.replace('/(tabs)');
    } catch (error) {
      setSubmitError(toAuthOperationError(error).message);
    }
  });

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede con la cuenta propietaria para administrar contratos y clientes."
      footer={
        <TextButton
          label="¿Olvidaste tu contraseña?"
          onPress={() => router.push('/(auth)/forgot-password')}
        />
      }>
      <View className="gap-4">
        {showResetSuccess ? (
          <AuthSuccessBanner message="Tu contraseña se actualizó. Inicia sesión con la nueva contraseña." />
        ) : null}
        {submitError ? <AuthErrorBanner message={submitError} /> : null}

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
              returnKeyType="next"
              textContentType="emailAddress"
              placeholder="correo@ejemplo.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthFormField
              inputRef={passwordRef}
              label="Contraseña"
              autoCapitalize="none"
              autoComplete="current-password"
              returnKeyType="go"
              textContentType="password"
              secureTextEntry
              placeholder="Tu contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              error={errors.password?.message}
            />
          )}
        />

        <PrimaryButton
          className="mt-2"
          label="Entrar"
          loading={isSubmitting}
          disabled={!isValid}
          onPress={() => {
            void onSubmit();
          }}
        />
      </View>
    </AuthShell>
  );
}
