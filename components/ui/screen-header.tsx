import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center gap-3">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={onBack}
          className="items-center justify-center w-11 h-11 rounded-full bg-surface-muted">
          <ChevronLeft color={colors['brand-strong']} size={22} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <AppText className="text-2xl font-semibold text-ink">{title}</AppText>
        {subtitle ? (
          <AppText className="mt-1 text-label text-ink-muted">{subtitle}</AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}
