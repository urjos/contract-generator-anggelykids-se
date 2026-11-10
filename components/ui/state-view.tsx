import { CircleAlert, Inbox } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { colors } from '@/constants/theme';

type StateViewProps = {
  tone?: 'empty' | 'error';
  title: string;
  description?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateView({
  tone = 'empty',
  title,
  description,
  loading = false,
  actionLabel,
  onAction,
}: StateViewProps) {
  const Icon = tone === 'error' ? CircleAlert : Inbox;
  const iconColor = tone === 'error' ? colors.danger : colors.brand;

  return (
    <View className="items-center px-6 py-10 rounded-2xl border border-border bg-surface">
      {loading ? (
        <ActivityIndicator color={colors.brand} size="large" />
      ) : (
        <View className="justify-center items-center mb-4 w-12 h-12 rounded-full bg-surface-muted">
          <Icon color={iconColor} size={22} />
        </View>
      )}
      <AppText className="text-center text-lg font-semibold text-ink">{title}</AppText>
      {description ? (
        <AppText className="mt-2 text-center text-body text-ink-muted">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton className="mt-5" label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}
