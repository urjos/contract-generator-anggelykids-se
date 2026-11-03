import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

import { supabaseEnvError } from '@/lib/env';

export function SupabaseConfigError() {
  return (
    <Screen>
      <View className="flex-1 justify-center px-5">
        <AppText className="text-2xl font-semibold">Configura Supabase</AppText>
        <AppText className="mt-3 text-body text-ink-muted">{supabaseEnvError}</AppText>
        <View className="mt-6 rounded-xl border border-border bg-surface p-4">
          <AppText className="text-label font-semibold uppercase text-ink-muted">
            Variables requeridas
          </AppText>
          <AppText className="mt-2 text-body text-ink">EXPO_PUBLIC_SUPABASE_URL</AppText>
          <AppText className="mt-1 text-body text-ink">EXPO_PUBLIC_SUPABASE_ANON_KEY</AppText>
        </View>
        <AppText className="mt-4 text-body text-ink-muted">
          Después de crear el archivo, detén Metro y vuelve a iniciarlo con npm run start.
        </AppText>
      </View>
    </Screen>
  );
}
