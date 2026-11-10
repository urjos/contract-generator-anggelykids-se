import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StateView } from '@/components/ui/state-view';
import { DraftForm } from '@/features/contracts/components/draft-form';

export default function EditContractScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  if (!id) {
    return (
      <Screen>
        <View className="px-5 pt-6">
          <StateView
            tone="error"
            title="Contrato no encontrado"
            description="Vuelve al listado e inténtalo de nuevo."
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <DraftForm
        contractId={id}
        onBack={() => router.back()}
        onSaved={() => router.back()}
      />
    </Screen>
  );
}
