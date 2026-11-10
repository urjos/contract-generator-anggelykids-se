import { useState } from 'react';
import { View } from 'react-native';

import { ErrorBanner } from '@/components/ui/error-banner';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { OptionChips } from '@/components/ui/option-chips';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/app-text';
import { parseSolesToCents } from '@/lib/format';

import { toContractOperationError } from '../contract-errors';
import {
  PAYMENT_KIND_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../contract-labels';
import {
  paymentFormSchema,
  type PaymentFormValues,
} from '../contract-schemas';
import { useRecordContractPayment } from '../use-contract-queries';

type PaymentFormProps = {
  visible: boolean;
  contractId: string;
  onClose: () => void;
  onSaved: () => void;
};

const DEFAULT_VALUES: PaymentFormValues = {
  amountInput: '',
  kind: 'deposit',
  method: 'cash',
  note: '',
};

export function PaymentForm({
  visible,
  contractId,
  onClose,
  onSaved,
}: PaymentFormProps) {
  const mutation = useRecordContractPayment();
  const [values, setValues] = useState<PaymentFormValues>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setValues(DEFAULT_VALUES);
    setError(null);
    onClose();
  }

  async function submit() {
    setError(null);

    const parsed = paymentFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del pago.');
      return;
    }

    const amountCents = parseSolesToCents(parsed.data.amountInput);
    if (amountCents === null) {
      setError('Ingresa un importe válido.');
      return;
    }

    try {
      await mutation.mutateAsync({
        contractId,
        amountCents,
        kind: parsed.data.kind,
        method: parsed.data.method,
        note: parsed.data.note || null,
      });
      setValues(DEFAULT_VALUES);
      setError(null);
      onSaved();
    } catch (submitError) {
      setError(toContractOperationError(submitError).message);
    }
  }

  return (
    <ModalSheet
      visible={visible}
      title="Registrar pago"
      description="El pago se suma al historial y actualiza el saldo."
      onClose={handleClose}
      footer={
        <PrimaryButton
          label="Registrar pago"
          loading={mutation.isPending}
          onPress={() => {
            void submit();
          }}
        />
      }>
      <View className="gap-4">
        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          label="Importe (S/)"
          required
          value={values.amountInput}
          onChangeText={(amountInput) =>
            setValues((current) => ({ ...current, amountInput }))
          }
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <View>
          <AppText className="mb-2 text-label font-semibold text-ink">
            Tipo de pago
          </AppText>
          <OptionChips
            options={PAYMENT_KIND_OPTIONS}
            value={values.kind}
            onChange={(kind) => setValues((current) => ({ ...current, kind }))}
          />
        </View>

        <View>
          <AppText className="mb-2 text-label font-semibold text-ink">
            Método de pago
          </AppText>
          <OptionChips
            options={PAYMENT_METHOD_OPTIONS}
            value={values.method}
            onChange={(method) =>
              setValues((current) => ({ ...current, method }))
            }
          />
        </View>

        <TextField
          label="Nota"
          value={values.note ?? ''}
          onChangeText={(note) =>
            setValues((current) => ({ ...current, note }))
          }
          placeholder="Opcional"
          multiline
        />
      </View>
    </ModalSheet>
  );
}
