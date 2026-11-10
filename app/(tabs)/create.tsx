import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { Screen } from '@/components/ui/screen';
import { DraftForm } from '@/features/contracts/components/draft-form';

export default function CreateContractScreen() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFormKey((current) => current + 1);
    }, []),
  );

  return (
    <Screen>
      <DraftForm
        key={formKey}
        onSaved={(contractId) => {
          router.replace({
            pathname: '/contracts/[id]',
            params: { id: contractId },
          });
        }}
      />
    </Screen>
  );
}
