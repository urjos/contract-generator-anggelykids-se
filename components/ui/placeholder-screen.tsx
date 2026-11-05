import type { ComponentType } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/theme";

type PlaceholderScreenProps = {
  title: string;
  description: string;
  icon: ComponentType<{ color?: string; size?: number }>;
};

export function PlaceholderScreen({
  title,
  description,
  icon: Icon,
}: PlaceholderScreenProps) {
  return (
    <Screen>
      <View className="flex-1 px-5 pt-6">
        <AppText className="mt-2 text-4xl font-semibold">{title}</AppText>

        <View className="items-center px-6 py-10 mt-8 rounded-2xl border border-border bg-surface">
          <View className="justify-center items-center mb-4 w-12 h-12 rounded-full bg-surface-muted">
            <Icon color={colors.brand} size={22} />
          </View>
          <AppText className="text-center text-body text-ink-muted">
            {description}
          </AppText>
          <AppText className="mt-3 text-label text-ink-muted">
            Disponible en una próxima unidad
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
