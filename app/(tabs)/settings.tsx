import { UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/theme";
import { toAuthOperationError } from "@/features/auth/auth-errors";
import { AuthErrorBanner } from "@/features/auth/components/auth-error-banner";
import { useAuth } from "@/features/auth/use-auth";
import { BrandSettingsForm } from "@/features/brand/components/brand-settings-form";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
    } catch (signOutError) {
      setError(toAuthOperationError(signOutError).message);
      setSigningOut(false);
    }
  }

  function requestSignOut() {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar la sesión de este dispositivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <AppText className="mt-2 text-4xl font-semibold">Ajustes</AppText>
        <AppText className="mt-2 text-body text-ink-muted">
          Administra los datos de marca y tu cuenta. Más adelante podrás
          gestionar aquí los paquetes y las plantillas.
        </AppText>

        <View className="mt-8">
          <BrandSettingsForm />
        </View>

        <View className="p-5 mt-6 rounded-2xl border border-border bg-surface">
          <View className="flex-row gap-3 items-center">
            <View className="justify-center items-center w-11 h-11 rounded-full bg-surface-muted">
              <UserRound color={colors["brand-strong"]} size={22} />
            </View>
            <View className="flex-1">
              <AppText className="font-semibold uppercase text-label text-ink-muted">
                Cuenta propietaria
              </AppText>
              <AppText className="mt-1 font-semibold text-body text-ink">
                {session?.user.email ?? "Sesión activa"}
              </AppText>
            </View>
          </View>

          {error ? (
            <View className="mt-4">
              <AuthErrorBanner message={error} />
            </View>
          ) : null}

          <PrimaryButton
            className="mt-5"
            label="Cerrar sesión"
            variant="danger"
            loading={signingOut}
            accessibilityLabel="Cerrar sesión"
            onPress={requestSignOut}
          />
        </View>

        <View className="p-5 mt-6 rounded-2xl bg-surface-muted">
          <AppText className="text-lg font-semibold">Próximamente</AppText>
          <AppText className="mt-2 text-body text-ink-muted">
            Catálogo de paquetes y versiones de plantilla.
          </AppText>
        </View>

        <AppText className="px-1 mt-6 text-label text-ink-muted">
          La sesión permanece activa hasta que cierres sesión.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
