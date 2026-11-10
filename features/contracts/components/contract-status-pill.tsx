import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

import {
  CONTRACT_STATUS_BADGE_CLASSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_TEXT_CLASSES,
} from '../contract-labels';
import type { ContractStatus } from '../contract-types';

type ContractStatusPillProps = {
  status: ContractStatus | null | undefined;
  className?: string;
};

export function ContractStatusPill({ status, className }: ContractStatusPillProps) {
  if (!status) {
    return null;
  }

  return (
    <View
      className={cn(
        'rounded-full border px-3 py-1',
        CONTRACT_STATUS_BADGE_CLASSES[status],
        className,
      )}>
      <AppText
        className={cn(
          'text-label font-semibold',
          CONTRACT_STATUS_TEXT_CLASSES[status],
        )}>
        {CONTRACT_STATUS_LABELS[status]}
      </AppText>
    </View>
  );
}
