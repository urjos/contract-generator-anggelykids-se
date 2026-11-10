import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/cn';

import { FILTER_STATUS_OPTIONS } from '../contract-labels';
import type { ContractStatus } from '../contract-types';

type ContractFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: ContractStatus | 'all';
  onStatusChange: (value: ContractStatus | 'all') => void;
  includeArchived: boolean;
  onToggleArchived: () => void;
};

export function ContractFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  includeArchived,
  onToggleArchived,
}: ContractFiltersProps) {
  return (
    <View className="gap-4">
      <TextField
        label="Buscar"
        placeholder="Cliente, teléfono, número o descripción"
        value={search}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      <View>
        <AppText className="mb-2 text-label font-semibold text-ink">Estado</AppText>
        <View className="flex-row flex-wrap gap-2">
          <FilterChip
            label="Todos"
            selected={status === 'all'}
            onPress={() => onStatusChange('all')}
          />
          {FILTER_STATUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={status === option.value}
              onPress={() => onStatusChange(option.value)}
            />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: includeArchived }}
        onPress={onToggleArchived}
        className="flex-row items-center gap-3 self-start min-h-11">
        <View
          className={cn(
            'items-center justify-center w-5 h-5 border rounded-md',
            includeArchived
              ? 'border-brand bg-brand'
              : 'border-border bg-surface',
          )}>
          {includeArchived ? (
            <AppText className="text-xs font-semibold text-surface">✓</AppText>
          ) : null}
        </View>
        <AppText className="text-body text-ink">
          Incluir contratos archivados
        </AppText>
      </Pressable>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'min-h-11 items-center justify-center rounded-full border px-4',
        selected ? 'border-brand bg-brand' : 'border-border bg-surface',
      )}>
      <AppText
        className={cn(
          'text-label font-semibold',
          selected ? 'text-surface' : 'text-ink-muted',
        )}>
        {label}
      </AppText>
    </Pressable>
  );
}
