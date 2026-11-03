import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

type AuthSuccessBannerProps = {
  message: string;
};

export function AuthSuccessBanner({ message }: AuthSuccessBannerProps) {
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      className="flex-row items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <Check color={colors.success} size={20} />
      <AppText className="flex-1 text-body text-ink">{message}</AppText>
    </View>
  );
}
