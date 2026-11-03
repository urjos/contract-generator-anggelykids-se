import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextButton } from '@/components/ui/text-button';
import { colors } from '@/constants/theme';
import { AuthErrorBanner } from '@/features/auth/components/auth-error-banner';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { toAuthOperationError } from '@/features/auth/auth-errors';
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';

type ResetStatus = 'starting' | 'ready' | 'invalid';

const INVALID_LINK_MESSAGE = 'El enlace de recuperación no es válido o ya expiró.';

function getRecoveryLinkError(errorCode?: string): string {
  if (errorCode === 'otp_expired' || errorCode === 'flow_state_expired') {
    return 'El enlace ya expiró. Solicita uno nuevo.';
  }
  return INVALID_LINK_MESSAGE;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { code, error, error_code } = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_code?: string;
  }>();
  const { beginPasswordRecovery, updatePassword } = useAuth();
  const [status, setStatus] = useState<ResetStatus>(() =>
    error || !code ? 'invalid' : 'starting',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (error) {
      return getRecoveryLinkError(error_code);
    }
    if (!code) {
      return INVALID_LINK_MESSAGE;
    }
    return null;
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code || error) {
      return;
    }

    if (startedCodeRef.current === code) {
      return;
    }
    startedCodeRef.current = code;

    void beginPasswordRecovery(code)
      .then(() => {
        if (mountedRef.current) {
          setStatus('ready');
        }
      })
      .catch((recoveryError) => {
        if (!mountedRef.current) {
          return;
        }
        setErrorMessage(toAuthOperationError(recoveryError).message);
        setStatus('invalid');
      });
  }, [code, error, beginPasswordRecovery]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await updatePassword(values.password);
      router.replace({ pathname: '/(auth)/login', params: { reset: 'success' } });
    } catch (updateError) {
      setSubmitError(toAuthOperationError(updateError).message);
    }
  });

  return (
    <AuthShell
      title={status === 'invalid' ? 'Enlace no válido' : 'Nueva contraseña'}
      description={
        status === 'invalid'
          ? 'Solicita un enlace nuevo para continuar con la recuperación.'
          : 'Crea una contraseña segura de al menos 8 caracteres.'
      }
      footer={
        <TextButton
          label="Volver a iniciar sesión"
          onPress={() => router.replace('/(auth)/login')}
        />
      }>
      <View className="gap-4">
        {status === 'starting' ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.brand} size="large" />
            <AppText className="mt-4 text-body text-ink-muted">
              Validando el enlace de recuperación…
            </AppText>
          </View>
        ) : null}

        {status === 'invalid' ? (
          <>
            <AuthErrorBanner
              message={errorMessage ?? 'El enlace de recuperación no es válido o ya expiró.'}
            />
            <PrimaryButton
              label="Solicitar un nuevo enlace"
              onPress={() => router.replace('/(auth)/forgot-password')}
            />
          </>
        ) : null}

        {status === 'ready' ? (
          <>
            {submitError ? <AuthErrorBanner message={submitError} /> : null}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthFormField
                  label="Nueva contraseña"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="next"
                  textContentType="newPassword"
                  secureTextEntry
                  placeholder="Mínimo 8 caracteres"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthFormField
                  label="Confirma la nueva contraseña"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="go"
                  textContentType="newPassword"
                  secureTextEntry
                  placeholder="Repite la contraseña"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={() => {
                    void onSubmit();
                  }}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <PrimaryButton
              className="mt-2"
              label="Guardar contraseña"
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
