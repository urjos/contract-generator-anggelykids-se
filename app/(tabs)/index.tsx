import { CalendarDays, FileText, Users, Wallet } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

const SUMMARY = [
  { key: 'contracts', label: 'Contratos', Icon: FileText },
  { key: 'events', label: 'Próximos eventos', Icon: CalendarDays },
  { key: 'balance', label: 'Saldo por cobrar', Icon: Wallet },
  { key: 'clients', label: 'Clientes', Icon: Users },
] as const;

export default function HomeScreen() {
  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}>
        <AppText className="text-label font-semibold uppercase text-brand-strong">
          Anggely Kids Shows y Eventos
        </AppText>
        <AppText className="mt-2 text-3xl font-semibold">Inicio</AppText>
        <AppText className="mt-2 text-body text-ink-muted">
          Contratos de shows infantiles y eventos, con historial y documentos en un solo lugar.
        </AppText>

        <View className="mt-8 flex-row flex-wrap gap-3">
          {SUMMARY.map(({ key, label, Icon }) => (
            <View
              key={key}
              className="min-w-[45%] flex-1 rounded-2xl border border-border bg-surface p-4">
              <Icon color={colors.brand} size={20} />
              <AppText className="mt-3 text-2xl font-semibold">—</AppText>
              <AppText className="mt-1 text-label text-ink-muted">{label}</AppText>
            </View>
          ))}
        </View>

        <View className="mt-8 rounded-2xl bg-surface-muted p-5">
          <AppText className="text-lg font-semibold">Aún no hay datos</AppText>
          <AppText className="mt-2 text-body text-ink-muted">
            Cuando conectes Supabase y crees el primer contrato, aquí verás el resumen de la
            operación.
          </AppText>
        </View>

        <View className="mt-8">
          <AppText className="text-lg font-semibold">Próximos pasos</AppText>
          <View className="mt-3 gap-3">
            <AppText className="rounded-xl border border-border bg-surface px-4 py-3 text-body">
              1. Configurar Supabase y la cuenta propietaria
            </AppText>
            <AppText className="rounded-xl border border-border bg-surface px-4 py-3 text-body">
              2. Implementar inicio de sesión
            </AppText>
            <AppText className="rounded-xl border border-border bg-surface px-4 py-3 text-body">
              3. Crear el primer contrato
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
