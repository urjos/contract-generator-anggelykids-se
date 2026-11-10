import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="flex-row items-start gap-3 rounded-xl border border-danger bg-surface-muted p-4">
      <CircleAlert color={colors.danger} size={20} />
      <AppText className="flex-1 text-body text-ink">{message}</AppText>
    </View>
  );
}
