import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import {
  Controller,
  useForm,
  useWatch,
  type Control,
} from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorBanner } from '@/components/ui/error-banner';
import { OptionChips } from '@/components/ui/option-chips';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionCard } from '@/components/ui/section-card';
import { StateView } from '@/components/ui/state-view';
import { TextField } from '@/components/ui/text-field';
import {
  centsToInput,
  formatCurrencyFromCents,
  formatLimaInput,
  formatPhone,
  formatPhoneInput,
} from '@/lib/format';

import { DateTimeSelect } from './date-time-select';
import { toContractOperationError } from '../contract-errors';
import { EVENT_TYPE_OPTIONS } from '../contract-labels';
import {
  draftFormSchema,
  draftFormValuesToPayload,
  type DraftFormValues,
} from '../contract-schemas';
import type { DraftDetails } from '../contract-types';
import {
  useClients,
  useCreateDraft,
  useDraftDetails,
  useServiceCatalog,
  useUpdateDraft,
} from '../use-contract-queries';

type DraftFormProps = {
  contractId?: string;
  onSaved: (contractId: string) => void;
  onBack?: () => void;
};

const DEFAULT_VALUES: DraftFormValues = {
  clientId: undefined,
  clientName: '',
  clientPhone: '',
  eventType: 'children_show',
  startsAtInput: '',
  venueName: '',
  venueAddress: '',
  district: '',
  city: '',
  guestCountInput: '',
  eventNotes: '',
  description: '',
  totalAmountInput: '',
  mobilityAmountInput: '0.00',
  clientVisibleNotes: '',
  internalNotes: '',
  templateId: undefined,
};

function detailsToFormValues(details: DraftDetails): DraftFormValues {
  const { contract, client, event } = details;

  return {
    clientId: contract.client_id,
    clientName: client.full_name,
    clientPhone: formatPhoneInput(client.phone_e164),
    eventType: event.event_type,
    startsAtInput: formatLimaInput(event.starts_at),
    venueName: event.venue_name ?? '',
    venueAddress: event.venue_address,
    district: event.district ?? '',
    city: event.city ?? '',
    guestCountInput: event.guest_count?.toString() ?? '',
    eventNotes: event.notes ?? '',
    description: contract.description,
    totalAmountInput: centsToInput(contract.total_amount_cents),
    mobilityAmountInput: centsToInput(contract.mobility_amount_cents),
    clientVisibleNotes: contract.client_visible_notes ?? '',
    internalNotes: contract.internal_notes ?? '',
    templateId: contract.template_id ?? undefined,
  };
}

type TextFieldName =
  | 'clientName'
  | 'clientPhone'
  | 'venueName'
  | 'venueAddress'
  | 'district'
  | 'city'
  | 'guestCountInput'
  | 'eventNotes'
  | 'description'
  | 'totalAmountInput'
  | 'mobilityAmountInput'
  | 'clientVisibleNotes'
  | 'internalNotes';

type ControlledTextFieldProps = {
  control: Control<DraftFormValues>;
  name: TextFieldName;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  transform?: (value: string) => string;
  onValueChange?: (value: string) => void;
};

function ControlledTextField({
  control,
  name,
  label,
  required,
  hint,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
  transform,
  onValueChange,
}: ControlledTextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          required={required}
          hint={hint}
          placeholder={placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          value={field.value ?? ''}
          onChangeText={(value) => {
            const nextValue = transform ? transform(value) : value;
            field.onChange(nextValue);
            onValueChange?.(nextValue);
          }}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function DraftForm({ contractId, onSaved, onBack }: DraftFormProps) {
  const isEditing = Boolean(contractId);
  const draftQuery = useDraftDetails(contractId);
  const clientsQuery = useClients();
  const catalogQuery = useServiceCatalog();
  const createMutation = useCreateDraft();
  const updateMutation = useUpdateDraft();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftFormSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  const clientId = useWatch({ control, name: 'clientId' });
  const clientName = useWatch({ control, name: 'clientName' });
  const clientPhone = useWatch({ control, name: 'clientPhone' });

  useEffect(() => {
    if (draftQuery.data) {
      reset(detailsToFormValues(draftQuery.data));
    }
  }, [draftQuery.data, reset]);

  const clientSuggestions = useMemo(() => {
    const nameTerm = clientName.trim().toLowerCase();
    const phoneTerm = clientPhone.replace(/[^\d+]/g, '');

    if (
      isEditing ||
      clientId ||
      (nameTerm.length < 2 && phoneTerm.length < 3)
    ) {
      return [];
    }

    const clients = clientsQuery.data ?? [];
    return clients
      .filter(
        (client) =>
          (nameTerm.length >= 2 &&
            client.full_name.toLowerCase().includes(nameTerm)) ||
          (phoneTerm.length >= 3 && client.phone_e164.includes(phoneTerm)),
      )
      .slice(0, 4);
  }, [
    isEditing,
    clientId,
    clientName,
    clientPhone,
    clientsQuery.data,
  ]);

  const selectedClient = useMemo(
    () => (clientsQuery.data ?? []).find((client) => client.id === clientId),
    [clientsQuery.data, clientId],
  );

  const catalog = catalogQuery.data ?? [];
  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const payload = draftFormValuesToPayload(values);

      if (contractId && draftQuery.data) {
        await updateMutation.mutateAsync({
          ...payload,
          contractId,
          expectedVersion: draftQuery.data.contract.version,
        });
        onSaved(contractId);
        return;
      }

      const created = await createMutation.mutateAsync(payload);
      onSaved(created.id);
    } catch (error) {
      setSubmitError(toContractOperationError(error).message);
    }
  });

  if (isEditing && draftQuery.isPending) {
    return <StateView loading title="Cargando borrador" />;
  }

  if (isEditing && draftQuery.isError) {
    return (
      <StateView
        tone="error"
        title="No pudimos cargar el borrador"
        description={draftQuery.error.message}
        actionLabel="Reintentar"
        onAction={() => {
          void draftQuery.refetch();
        }}
      />
    );
  }

  if (
    isEditing &&
    draftQuery.data &&
    draftQuery.data.contract.status !== 'draft'
  ) {
    return (
      <StateView
        tone="empty"
        title="Este contrato ya no es un borrador"
        description="Solo los borradores se pueden editar. Abre el detalle para revisar su estado."
        actionLabel="Volver"
        onAction={() => onBack?.()}
      />
    );
  }

  return (
    <ScrollView
      contentContainerClassName="px-5 pb-10 pt-6"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {onBack ? (
        <ScreenHeader
          title={isEditing ? 'Editar borrador' : 'Nuevo contrato'}
          onBack={onBack}
        />
      ) : (
        <AppText className="mt-2 text-4xl font-semibold">
          {isEditing ? 'Editar borrador' : 'Nuevo contrato'}
        </AppText>
      )}
      <AppText className="mt-2 text-body text-ink-muted">
        Completa los datos del cliente, el evento y el acuerdo. Guardar no
        confirma el contrato ni consume número.
      </AppText>

      {submitError ? (
        <View className="mt-5">
          <ErrorBanner message={submitError} />
        </View>
      ) : null}

      <SectionCard className="mt-5" title="Cliente">
        <View className="gap-4">
          <View>
            <ControlledTextField
              control={control}
              name="clientName"
              label="Nombre del cliente"
              required
              placeholder="Nombre y apellido"
              onValueChange={() => setValue('clientId', undefined)}
            />
            {selectedClient && !isEditing ? (
              <View className="flex-row items-center justify-between gap-3 p-3 mt-2 rounded-xl bg-surface-muted">
                <AppText className="flex-1 text-label text-ink-muted">
                  Cliente existente: {selectedClient.full_name}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quitar cliente seleccionado"
                  onPress={() => setValue('clientId', undefined)}>
                  <AppText className="text-label font-semibold text-brand-strong">
                    Quitar
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            {clientSuggestions.length > 0 ? (
              <View className="mt-2 rounded-xl border border-border bg-surface">
                {clientSuggestions.map((client) => (
                  <Pressable
                    key={client.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar cliente ${client.full_name}`}
                    onPress={() => {
                      setValue('clientId', client.id);
                      setValue('clientName', client.full_name, {
                        shouldValidate: true,
                      });
                      setValue('clientPhone', formatPhoneInput(client.phone_e164), {
                        shouldValidate: true,
                      });
                    }}
                    className="px-3 py-3 border-b border-border last:border-b-0">
                    <AppText className="font-semibold text-body text-ink">
                      {client.full_name}
                    </AppText>
                    <AppText className="mt-1 text-label text-ink-muted">
                      {formatPhone(client.phone_e164)}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <ControlledTextField
            control={control}
            name="clientPhone"
            label="Celular"
            required
            placeholder="999 999 999"
            keyboardType="phone-pad"
            transform={formatPhoneInput}
            hint="9 dígitos. Se agrega +51 automáticamente."
            onValueChange={() => setValue('clientId', undefined)}
          />
        </View>
      </SectionCard>

      <SectionCard className="mt-4" title="Evento">
        <View className="gap-4">
          <View>
            <AppText className="mb-2 text-label font-semibold text-ink">
              Tipo de evento
            </AppText>
            <Controller
              control={control}
              name="eventType"
              render={({ field, fieldState }) => (
                <View>
                  <OptionChips
                    options={EVENT_TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {fieldState.error ? (
                    <AppText className="mt-2 text-label text-danger">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="startsAtInput"
            render={({ field, fieldState }) => (
              <DateTimeSelect
                required
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <ControlledTextField
            control={control}
            name="venueAddress"
            label="Lugar de presentación"
            required
            placeholder="Dirección y referencias"
            multiline
          />

          <ControlledTextField
            control={control}
            name="venueName"
            label="Nombre del local"
            placeholder="Opcional"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <ControlledTextField
                control={control}
                name="district"
                label="Distrito"
                placeholder="Opcional"
              />
            </View>
            <View className="flex-1">
              <ControlledTextField
                control={control}
                name="city"
                label="Ciudad"
                placeholder="Opcional"
              />
            </View>
          </View>

          <ControlledTextField
            control={control}
            name="guestCountInput"
            label="Número de asistentes"
            placeholder="Opcional"
            keyboardType="number-pad"
          />

          <ControlledTextField
            control={control}
            name="eventNotes"
            label="Observaciones del evento"
            placeholder="Opcional"
            multiline
          />
        </View>
      </SectionCard>

      <SectionCard className="mt-4" title="Servicio y acuerdo">
        <View className="gap-4">
          {catalog.length > 0 ? (
            <View>
              <AppText className="mb-2 text-label font-semibold text-ink">
                Paquetes del catálogo
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {catalog.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar paquete ${item.name}`}
                    onPress={() => {
                      setValue('description', item.description || item.name, {
                        shouldValidate: true,
                      });
                      setValue('totalAmountInput', centsToInput(item.price_cents), {
                        shouldValidate: true,
                      });
                    }}
                    className="px-3 py-3 border rounded-xl border-border bg-surface">
                    <AppText className="font-semibold text-label text-ink">
                      {item.name}
                    </AppText>
                    <AppText className="mt-1 text-label text-ink-muted">
                      {formatCurrencyFromCents(item.price_cents)}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText className="mt-2 text-label text-ink-muted">
                Elegir un paquete solo precarga la descripción y el monto; puedes
                ajustarlos.
              </AppText>
            </View>
          ) : null}

          <ControlledTextField
            control={control}
            name="description"
            label="Descripción del servicio"
            required
            placeholder="Paquete, personajes, duración y adicionales acordados"
            multiline
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <ControlledTextField
                control={control}
                name="totalAmountInput"
                label="Monto acordado (S/)"
                required
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <ControlledTextField
                control={control}
                name="mobilityAmountInput"
                label="Movilidad (S/)"
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <ControlledTextField
            control={control}
            name="clientVisibleNotes"
            label="Notas visibles para el cliente"
            placeholder="Opcional"
            multiline
          />

          <ControlledTextField
            control={control}
            name="internalNotes"
            label="Notas internas"
            placeholder="Opcional, no se imprimen"
            multiline
          />
        </View>
      </SectionCard>

      <View className="mt-6">
        <PrimaryButton
          label={isEditing ? 'Guardar cambios' : 'Guardar borrador'}
          loading={busy}
          onPress={() => {
            void onSubmit();
          }}
        />
        <AppText className="mt-3 text-center text-label text-ink-muted">
          {isEditing
            ? 'Los cambios se guardan como borrador y no alteran contratos firmados.'
            : 'El contrato se guardará como borrador y no consumirá número.'}
        </AppText>
      </View>
    </ScrollView>
  );
}
