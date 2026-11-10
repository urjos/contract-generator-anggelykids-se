import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { StateView } from '@/components/ui/state-view';
import { colors } from '@/constants/theme';
import { ContractCard } from '@/features/contracts/components/contract-card';
import { ContractFilters } from '@/features/contracts/components/contract-filters';
import type { ContractStatus } from '@/features/contracts/contract-types';
import { useContracts } from '@/features/contracts/use-contract-queries';
import { useDebouncedValue } from '@/lib/use-debounced-value';

export default function ContractsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContractStatus | 'all'>('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      statuses: status === 'all' ? undefined : [status],
      includeArchived,
      limit: 50,
    }),
    [debouncedSearch, status, includeArchived],
  );

  const query = useContracts(filters);
  const contracts = query.data ?? [];

  return (
    <Screen>
      <FlatList
        data={contracts}
        keyExtractor={(item, index) =>
          item.contract_id ?? `contract-${index}`
        }
        contentContainerClassName="px-5 pb-8 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isPending}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={colors.brand}
          />
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <View className="mb-5">
            <AppText className="mt-2 text-4xl font-semibold">Contratos</AppText>
            <AppText className="mt-2 text-body text-ink-muted">
              Busca, revisa y opera los contratos de tus eventos.
            </AppText>

            <View className="mt-6">
              <ContractFilters
                search={search}
                onSearchChange={setSearch}
                status={status}
                onStatusChange={setStatus}
                includeArchived={includeArchived}
                onToggleArchived={() => setIncludeArchived((value) => !value)}
              />
            </View>

            {!query.isPending && !query.isError ? (
              <AppText className="mt-5 text-label text-ink-muted">
                {contracts.length === 0
                  ? 'Sin resultados'
                  : `${contracts.length} contrato${contracts.length === 1 ? '' : 's'}`}
              </AppText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <StateView loading title="Cargando contratos" />
          ) : query.isError ? (
            <StateView
              tone="error"
              title="No pudimos cargar los contratos"
              description={query.error.message}
              actionLabel="Reintentar"
              onAction={() => {
                void query.refetch();
              }}
            />
          ) : (
            <StateView
              title="Aún no hay contratos"
              description="Crea el primer borrador para empezar a registrar eventos y pagos."
              actionLabel="Crear contrato"
              onAction={() => router.push('/(tabs)/create')}
            />
          )
        }
        renderItem={({ item }) => (
          <ContractCard
            contract={item}
            onPress={() => {
              if (item.contract_id) {
                router.push({
                  pathname: '/contracts/[id]',
                  params: { id: item.contract_id },
                });
              }
            }}
          />
        )}
      />
    </Screen>
  );
}
