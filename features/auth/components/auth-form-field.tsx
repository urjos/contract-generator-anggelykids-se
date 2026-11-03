import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type Ref } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

type AuthFormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  inputRef?: Ref<TextInputInstance>;
};

export function AuthFormField({
  label,
  error,
  inputRef,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}: AuthFormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View>
      <AppText className="mb-2 text-label font-semibold text-ink">{label}</AppText>
      <View
        className={
          focused
            ? 'flex-row items-center rounded-xl border-2 border-brand bg-surface px-4'
            : error
              ? 'flex-row items-center rounded-xl border border-danger bg-surface px-4'
              : 'flex-row items-center rounded-xl border border-border bg-surface px-4'
        }>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          className="h-12 flex-1 text-body text-ink"
          placeholderTextColor={colors['ink-muted']}
          {...props}
          secureTextEntry={isPassword && !passwordVisible}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setPasswordVisible((current) => !current)}>
            {passwordVisible ? (
              <EyeOff color={colors['ink-muted']} size={20} />
            ) : (
              <Eye color={colors['ink-muted']} size={20} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityLiveRegion="polite" className="mt-2 text-label text-danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
