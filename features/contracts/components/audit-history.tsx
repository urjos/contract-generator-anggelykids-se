import { History } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';

import { auditActionLabel, contractStatusLabel } from '../contract-labels';
import type { AuditStatusChange, ContractAuditEntry } from '../contract-types';

type AuditHistoryProps = {
  entries: ContractAuditEntry[];
  loading?: boolean;
};

function readStatusChange(entry: ContractAuditEntry): AuditStatusChange | null {
  const changes = entry.changes;
  if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
    return null;
  }
  return changes as AuditStatusChange;
}

export function AuditHistory({ entries, loading = false }: AuditHistoryProps) {
  if (loading) {
    return (
      <AppText className="text-body text-ink-muted">
        Cargando historial…
      </AppText>
    );
  }

  if (entries.length === 0) {
    return (
      <View className="items-center py-6 rounded-xl bg-surface-muted">
        <History color={colors.brand} size={22} />
        <AppText className="mt-2 text-body text-ink-muted">
          Todavía no hay movimientos registrados.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {entries.map((entry) => {
        const change = readStatusChange(entry);
        const beforeStatus = change?.before?.status;
        const afterStatus = change?.after?.status;
        const statusChanged =
          beforeStatus && afterStatus && beforeStatus !== afterStatus;

        return (
          <View
            key={`${entry.id}-${entry.created_at}`}
            className="p-4 rounded-xl border border-border bg-surface">
            <View className="flex-row items-start justify-between gap-3">
              <AppText className="flex-1 font-semibold text-body text-ink">
                {auditActionLabel(entry.action)}
              </AppText>
              <AppText className="text-label text-ink-muted">
                {formatDateTime(entry.created_at)}
              </AppText>
            </View>
            {statusChanged ? (
              <AppText className="mt-1 text-label text-ink-muted">
                {contractStatusLabel(beforeStatus)} →{' '}
                {contractStatusLabel(afterStatus)}
              </AppText>
            ) : null}
            {change?.after?.cancellation_reason ? (
              <AppText className="mt-1 text-label text-ink-muted">
                Motivo: {change.after.cancellation_reason}
              </AppText>
            ) : null}
            {change?.after?.signed_by_name ? (
              <AppText className="mt-1 text-label text-ink-muted">
                Firmado por: {change.after.signed_by_name}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
