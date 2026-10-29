import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

export default function NotFoundScreen() {
  return (
    <Screen className="px-5 pt-6">
      <AppText className="text-2xl font-semibold">Pantalla no encontrada</AppText>
      <AppText className="mt-2 text-body text-ink-muted">
        La ruta que buscabas no existe en esta versión de la app.
      </AppText>
      <Link href="/" asChild>
        <Pressable className="mt-6 min-h-11 justify-center">
          <AppText className="text-body font-semibold text-brand">Volver al inicio</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}
