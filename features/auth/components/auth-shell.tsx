import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="items-center">
            <Image
              accessibilityLabel="Anggely Kids Shows y Eventos"
              source={require('../../../assets/brand/logo.png')}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <AppText className="mt-2 text-label font-semibold uppercase text-brand-strong">
              Anggely Kids Shows y Eventos
            </AppText>
          </View>

          <View className="mt-8">
            <AppText className="text-3xl font-semibold">{title}</AppText>
            <AppText className="mt-2 text-body text-ink-muted">{description}</AppText>
          </View>

          <View className="mt-6">{children}</View>
          {footer ? <View className="mt-6">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
