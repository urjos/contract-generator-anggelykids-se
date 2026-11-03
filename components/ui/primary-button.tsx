import { ActivityIndicator, Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';

type PrimaryButtonVariant = 'primary' | 'secondary' | 'danger';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  accessibilityLabel?: string;
  className?: string;
};

const VARIANT_CLASSES: Record<PrimaryButtonVariant, string> = {
  primary: 'bg-brand',
  secondary: 'border border-border bg-surface',
  danger: 'bg-danger',
};

const TEXT_CLASSES: Record<PrimaryButtonVariant, string> = {
  primary: 'text-surface',
  secondary: 'text-ink',
  danger: 'text-surface',
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
  className,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={cn(
        'h-12 flex-row items-center justify-center rounded-xl px-5',
        VARIANT_CLASSES[variant],
        isDisabled && 'opacity-60',
        className,
      )}
      style={({ pressed }) => (pressed && !isDisabled ? { opacity: 0.85 } : undefined)}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.brand : colors.surface} />
      ) : (
        <AppText className={cn('text-body font-semibold', TEXT_CLASSES[variant])}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
