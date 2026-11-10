import { CalendarDays, ChevronRight, Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import {
  formatContractNumber,
  formatCurrencyFromCents,
  formatDateTime,
} from '@/lib/format';

import { eventTypeLabel } from '../contract-labels';
import type { ContractOverview } from '../contract-types';
import { ContractStatusPill } from './contract-status-pill';

type ContractCardProps = {
  contract: ContractOverview;
  onPress: () => void;
};

export function ContractCard({ contract, onPress }: ContractCardProps) {
  const balance = contract.balance_cents ?? 0;
  const paid = contract.paid_amount_cents ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Contrato de ${contract.client_name ?? 'cliente'}`}
      onPress={onPress}
      className="p-4 rounded-2xl border border-border bg-surface">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <AppText className="font-semibold text-body text-ink">
            {formatContractNumber(contract.contract_number)}
          </AppText>
          <AppText className="mt-1 text-lg font-semibold text-ink">
            {contract.client_name ?? 'Cliente'}
          </AppText>
        </View>
        <ContractStatusPill status={contract.status} />
      </View>

      <View className="flex-row items-center gap-2 mt-3">
        <CalendarDays color={colors['ink-muted']} size={16} />
        <AppText className="flex-1 text-label text-ink-muted">
          {formatDateTime(contract.event_starts_at)} ·{' '}
          {eventTypeLabel(contract.event_type)}
        </AppText>
      </View>

      {contract.description ? (
        <AppText className="mt-3 text-body text-ink-muted" numberOfLines={2}>
          {contract.description}
        </AppText>
      ) : null}

      <View className="flex-row items-center justify-between gap-3 mt-4">
        <View className="flex-1">
          <AppText className="text-label text-ink-muted">Total</AppText>
          <AppText className="font-semibold text-body text-ink">
            {formatCurrencyFromCents(contract.total_amount_cents)}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText className="text-label text-ink-muted">
            {balance > 0 ? 'Saldo' : 'Pagado'}
          </AppText>
          <View className="flex-row items-center gap-2">
            <Wallet
              color={balance > 0 ? colors.warning : colors.success}
              size={16}
            />
            <AppText
              className={
                balance > 0
                  ? 'font-semibold text-body text-warning'
                  : 'font-semibold text-body text-success'
              }>
              {formatCurrencyFromCents(balance > 0 ? balance : paid)}
            </AppText>
          </View>
        </View>
        <ChevronRight color={colors['ink-muted']} size={20} />
      </View>
    </Pressable>
  );
}
