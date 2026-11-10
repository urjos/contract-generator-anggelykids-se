import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type OptionChipsProps<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
};

export function OptionChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: OptionChipsProps<T>) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            className={cn(
              'min-h-11 items-center justify-center rounded-full border px-4',
              selected
                ? 'border-brand bg-brand'
                : 'border-border bg-surface',
            )}>
            <AppText
              className={cn(
                'text-label font-semibold',
                selected ? 'text-surface' : 'text-ink-muted',
              )}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
