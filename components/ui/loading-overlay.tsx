import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

type LoadingOverlayProps = {
  message?: string;
};

export function LoadingOverlay({ message = 'Cargando…' }: LoadingOverlayProps) {
  return (
    <View
      accessible
      accessibilityLabel={message}
      style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
      className="items-center justify-center bg-canvas px-6">
      <ActivityIndicator color={colors.brand} size="large" />
      <AppText className="mt-4 text-body text-ink-muted">{message}</AppText>
    </View>
  );
}
