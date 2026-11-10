import { Wallet } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { formatCurrencyFromCents, formatDateTime } from '@/lib/format';

import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS } from '../contract-labels';
import type { ContractPayment } from '../contract-types';

type PaymentListProps = {
  payments: ContractPayment[];
  loading?: boolean;
};

export function PaymentList({ payments, loading = false }: PaymentListProps) {
  if (loading) {
    return <AppText className="text-body text-ink-muted">Cargando pagos…</AppText>;
  }

  if (payments.length === 0) {
    return (
      <View className="items-center py-6 rounded-xl bg-surface-muted">
        <Wallet color={colors.brand} size={22} />
        <AppText className="mt-2 text-body text-ink-muted">
          Todavía no hay pagos registrados.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {payments.map((payment) => (
        <View
          key={payment.id}
          className="p-4 rounded-xl border border-border bg-surface">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <AppText className="font-semibold text-body text-ink">
                {formatCurrencyFromCents(payment.amount_cents)}
              </AppText>
              <AppText className="mt-1 text-label text-ink-muted">
                {PAYMENT_KIND_LABELS[payment.kind]} ·{' '}
                {PAYMENT_METHOD_LABELS[payment.method]}
              </AppText>
            </View>
            <AppText className="text-label text-ink-muted">
              {formatDateTime(payment.paid_at)}
            </AppText>
          </View>
          {payment.note ? (
            <AppText className="mt-2 text-label text-ink-muted">
              {payment.note}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}
