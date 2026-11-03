import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

export function TextButton({ label, onPress, disabled = false, className }: TextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-11 items-center justify-center px-2',
        disabled && 'opacity-60',
        className,
      )}>
      <AppText className="text-body font-semibold text-brand-strong">{label}</AppText>
    </Pressable>
  );
}
