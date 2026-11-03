import '../global.css';

import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/auth-provider';
import { SessionRestoreError } from '@/features/auth/components/session-restore-error';
import { SupabaseConfigError } from '@/features/auth/components/supabase-config-error';
import { useAuth } from '@/features/auth/use-auth';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { status, restoreError, retrySessionRestore } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'recovery' && pathname !== '/reset-password') {
      router.replace('/(auth)/reset-password');
    }
  }, [status, pathname, router]);

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}>
        <Stack.Protected guard={status === 'authenticated'} redirectTo="/(auth)/login">
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={status !== 'authenticated'} redirectTo="/(tabs)">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      {status === 'loading' ? <LoadingOverlay message="Preparando tu cuenta…" /> : null}
      {status === 'error' ? (
        <View className="absolute inset-0 z-50 bg-canvas">
          <SessionRestoreError
            message={restoreError ?? 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.'}
            onRetry={() => {
              void retrySessionRestore();
            }}
          />
        </View>
      ) : null}
      {status === 'unconfigured' ? (
        <View className="absolute inset-0 z-50 bg-canvas">
          <SupabaseConfigError />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
