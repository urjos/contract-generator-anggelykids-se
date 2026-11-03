import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';

import { AuthErrorBanner } from './auth-error-banner';

type SessionRestoreErrorProps = {
  message: string;
  onRetry: () => void;
};

export function SessionRestoreError({ message, onRetry }: SessionRestoreErrorProps) {
  return (
    <Screen>
      <View className="flex-1 justify-center px-5">
        <AppText className="text-2xl font-semibold">No pudimos restaurar la sesión</AppText>
        <AppText className="mt-2 text-body text-ink-muted">
          Revisa tu conexión y vuelve a intentarlo. Tus datos no se modificaron.
        </AppText>
        <View className="mt-6">
          <AuthErrorBanner message={message} />
        </View>
        <PrimaryButton className="mt-6" label="Reintentar" onPress={onRetry} />
      </View>
    </Screen>
  );
}
