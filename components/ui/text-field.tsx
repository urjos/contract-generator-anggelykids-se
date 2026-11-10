import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
  inputClassName?: string;
};

export function TextField({
  label,
  error,
  hint,
  required = false,
  containerClassName,
  inputClassName,
  multiline,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={containerClassName}>
      <AppText className="mb-2 text-label font-semibold text-ink">
        {label}
        {required ? <AppText className="text-danger"> *</AppText> : null}
      </AppText>
      <View
        className={cn(
          'rounded-xl border bg-surface px-4',
          multiline ? 'py-3' : 'justify-center',
          focused ? 'border-2 border-brand' : error ? 'border-danger' : 'border-border',
          !editable && 'bg-surface-muted',
        )}>
        <TextInput
          accessibilityLabel={label}
          className={cn(
            'text-body text-ink',
            multiline ? 'min-h-24' : 'h-12',
            inputClassName,
          )}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={colors['ink-muted']}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </View>
      {hint && !error ? (
        <AppText className="mt-2 text-label text-ink-muted">{hint}</AppText>
      ) : null}
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          className="mt-2 text-label text-danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
