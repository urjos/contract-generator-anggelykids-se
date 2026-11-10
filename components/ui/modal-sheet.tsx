import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';

type ModalSheetProps = {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ModalSheet({
  visible,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute inset-0 bg-ink/40"
        />
        <View
          className="rounded-t-3xl bg-surface px-5 pt-5"
          style={{ maxHeight: '90%', paddingBottom: insets.bottom + 20 }}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <AppText className="text-xl font-semibold text-ink">{title}</AppText>
              {description ? (
                <AppText className="mt-1 text-label text-ink-muted">
                  {description}
                </AppText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
              onPress={onClose}
              className="items-center justify-center w-11 h-11 rounded-full bg-surface-muted">
              <AppText className="text-lg font-semibold text-brand-strong">×</AppText>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="py-4">
            {children}
          </ScrollView>

          {footer ? <View className="pt-2">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
