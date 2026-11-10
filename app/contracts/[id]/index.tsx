import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorBanner } from '@/components/ui/error-banner';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionCard } from '@/components/ui/section-card';
import { StateView } from '@/components/ui/state-view';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import {
  formatContractNumber,
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
  formatPhone,
} from '@/lib/format';

import { toContractOperationError } from '@/features/contracts/contract-errors';
import { AuditHistory } from '@/features/contracts/components/audit-history';
import { ContractStatusPill } from '@/features/contracts/components/contract-status-pill';
import { PaymentForm } from '@/features/contracts/components/payment-form';
import { PaymentList } from '@/features/contracts/components/payment-list';
import {
  cancelFormSchema,
  signFormSchema,
} from '@/features/contracts/contract-schemas';
import { eventTypeLabel } from '@/features/contracts/contract-labels';
import type { ContractOverview } from '@/features/contracts/contract-types';
import {
  useAnnulAndReplaceContract,
  useArchiveContract,
  useCancelContract,
  useConfirmContract,
  useContractAudit,
  useContractOverview,
  useContractPayments,
  useDeleteDraft,
  useSignContract,
} from '@/features/contracts/use-contract-queries';

type ModalKind = 'sign' | 'cancel' | 'annul' | 'payment' | null;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <AppText className="flex-1 text-label text-ink-muted">{label}</AppText>
      <AppText className="flex-1 text-right text-body text-ink">{value}</AppText>
    </View>
  );
}

function formatLocation(contract: ContractOverview): string {
  const parts = [contract.district, contract.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin distrito';
}

export default function ContractDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const overviewQuery = useContractOverview(id);
  const paymentsQuery = useContractPayments(id);
  const auditQuery = useContractAudit(id);

  const confirmMutation = useConfirmContract();
  const signMutation = useSignContract();
  const cancelMutation = useCancelContract();
  const annulMutation = useAnnulAndReplaceContract();
  const archiveMutation = useArchiveContract();
  const deleteMutation = useDeleteDraft();

  const [modal, setModal] = useState<ModalKind>(null);
  const [signedByName, setSignedByName] = useState('');
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const contract = overviewQuery.data;
  const expectedVersion = contract?.version ?? 1;
  const contractId = id ?? '';

  function openModal(kind: Exclude<ModalKind, null>) {
    setModalError(null);
    setModal(kind);
    if (kind === 'sign') {
      setSignedByName('');
    }
    if (kind === 'cancel' || kind === 'annul') {
      setReason('');
    }
  }

  async function executeConfirm() {
    try {
      await confirmMutation.mutateAsync({ contractId, expectedVersion });
      Alert.alert('Contrato confirmado', 'Se asignó el número definitivo.');
    } catch (error) {
      Alert.alert(
        'No pudimos confirmar',
        toContractOperationError(error).message,
      );
    }
  }

  function requestConfirm() {
    Alert.alert(
      'Confirmar contrato',
      'Se asignará el número definitivo y quedará pendiente de firma. Ya no podrás editar sus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            void executeConfirm();
          },
        },
      ],
    );
  }

  async function executeSign() {
    const parsed = signFormSchema.safeParse({ signedByName });
    if (!parsed.success) {
      setModalError(parsed.error.issues[0]?.message ?? 'Revisa el nombre.');
      return;
    }

    try {
      await signMutation.mutateAsync({
        contractId,
        expectedVersion,
        signedByName: parsed.data.signedByName,
      });
      setModal(null);
      Alert.alert('Contrato firmado', 'El contrato quedó registrado como firmado.');
    } catch (error) {
      setModalError(toContractOperationError(error).message);
    }
  }

  async function executeCancel() {
    const parsed = cancelFormSchema.safeParse({ reason });
    if (!parsed.success) {
      setModalError(parsed.error.issues[0]?.message ?? 'Revisa el motivo.');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        contractId,
        expectedVersion,
        reason: parsed.data.reason,
      });
      setModal(null);
      Alert.alert('Contrato cancelado', 'El motivo quedó registrado.');
    } catch (error) {
      setModalError(toContractOperationError(error).message);
    }
  }

  async function executeAnnul() {
    const parsed = cancelFormSchema.safeParse({ reason });
    if (!parsed.success) {
      setModalError(parsed.error.issues[0]?.message ?? 'Revisa el motivo.');
      return;
    }

    try {
      const result = await annulMutation.mutateAsync({
        contractId,
        expectedVersion,
        reason: parsed.data.reason,
        replacementEventId: null,
      });
      setModal(null);
      Alert.alert(
        'Contrato anulado',
        'Se creó un borrador de reemplazo enlazado al contrato original.',
        [
          {
            text: 'Ver reemplazo',
            onPress: () => {
              router.replace({
                pathname: '/contracts/[id]',
                params: { id: result.replacement_contract.id },
              });
            },
          },
        ],
      );
    } catch (error) {
      setModalError(toContractOperationError(error).message);
    }
  }

  async function executeArchive() {
    try {
      await archiveMutation.mutateAsync({ contractId, expectedVersion });
      Alert.alert('Contrato archivado', 'Ya no aparecerá en la lista activa.');
    } catch (error) {
      Alert.alert(
        'No pudimos archivar',
        toContractOperationError(error).message,
      );
    }
  }

  function requestArchive() {
    Alert.alert(
      'Archivar contrato',
      'El contrato se ocultará de la lista activa y quedará solo para consulta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          onPress: () => {
            void executeArchive();
          },
        },
      ],
    );
  }

  async function executeDelete() {
    try {
      await deleteMutation.mutateAsync(contractId);
      router.replace('/(tabs)/contracts');
    } catch (error) {
      Alert.alert(
        'No pudimos eliminar',
        toContractOperationError(error).message,
      );
    }
  }

  function requestDelete() {
    Alert.alert(
      'Eliminar borrador',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void executeDelete();
          },
        },
      ],
    );
  }

  if (!id) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View className="px-5 pt-6">
          <StateView
            tone="error"
            title="Contrato no encontrado"
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (overviewQuery.isPending) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View className="px-5 pt-6">
          <StateView loading title="Cargando contrato" />
        </View>
      </Screen>
    );
  }

  if (overviewQuery.isError || !contract) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View className="px-5 pt-6">
          <ScreenHeader title="Contrato" onBack={() => router.back()} />
          <View className="mt-5">
            <StateView
              tone="error"
              title="No pudimos cargar el contrato"
              description={
                overviewQuery.error?.message ??
                'El contrato no está disponible.'
              }
              actionLabel="Reintentar"
              onAction={() => {
                void overviewQuery.refetch();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const status = contract.status;
  const total = contract.total_amount_cents ?? 0;
  const paid = contract.paid_amount_cents ?? 0;
  const balance = contract.balance_cents ?? total;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const canPay =
    status === 'draft' || status === 'pending_signature' || status === 'signed';
  const hasActions =
    status === 'draft' ||
    status === 'pending_signature' ||
    status === 'signed' ||
    status === 'cancelled' ||
    status === 'annulled';

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerClassName="px-5 pb-10 pt-6"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={formatContractNumber(contract.contract_number)}
          subtitle={contract.client_name ?? 'Cliente'}
          onBack={() => router.back()}
          right={<ContractStatusPill status={status} />}
        />

        <SectionCard className="mt-5">
          <AppText className="text-lg font-semibold text-ink">
            Resumen del contrato
          </AppText>
          <AppText className="mt-2 text-body text-ink-muted">
            {contract.description || 'Sin descripción'}
          </AppText>

          <View className="gap-3 mt-4">
            <InfoRow label="Creado" value={formatDate(contract.created_at)} />
            {contract.confirmed_at ? (
              <InfoRow
                label="Confirmado"
                value={formatDateTime(contract.confirmed_at)}
              />
            ) : null}
            {contract.signed_at ? (
              <InfoRow label="Firmado" value={formatDateTime(contract.signed_at)} />
            ) : null}
            {contract.cancelled_at ? (
              <InfoRow
                label="Cancelado"
                value={formatDateTime(contract.cancelled_at)}
              />
            ) : null}
          </View>

          {contract.cancellation_reason ? (
            <View className="p-3 mt-4 rounded-xl bg-surface-muted">
              <AppText className="text-label font-semibold text-danger">
                Motivo registrado
              </AppText>
              <AppText className="mt-1 text-body text-ink">
                {contract.cancellation_reason}
              </AppText>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard className="mt-4" title="Cliente">
          <View className="gap-3">
            <InfoRow label="Nombre" value={contract.client_name ?? 'Sin nombre'} />
            <InfoRow
              label="Celular"
              value={formatPhone(contract.client_phone)}
            />
            {contract.client_phone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Llamar al cliente"
                onPress={() => {
                  void Linking.openURL(`tel:${contract.client_phone}`);
                }}
                className="flex-row items-center gap-2 self-start min-h-11">
                <Phone color={colors.brand} size={18} />
                <AppText className="font-semibold text-body text-brand-strong">
                  Llamar
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard className="mt-4" title="Evento">
          <View className="gap-3">
            <InfoRow
              label="Tipo"
              value={eventTypeLabel(contract.event_type)}
            />
            <InfoRow
              label="Fecha y hora"
              value={formatDateTime(contract.event_starts_at)}
            />
            <InfoRow
              label="Local"
              value={contract.venue_name || 'Sin local'}
            />
            <InfoRow
              label="Dirección"
              value={contract.venue_address ?? 'Sin dirección'}
            />
            <InfoRow label="Distrito" value={formatLocation(contract)} />
            <InfoRow
              label="Asistentes"
              value={
                contract.guest_count ? String(contract.guest_count) : 'No indicado'
              }
            />
          </View>
        </SectionCard>

        <SectionCard className="mt-4" title="Importes">
          <View className="gap-3">
            <InfoRow
              label="Monto acordado"
              value={formatCurrencyFromCents(total)}
            />
            {(contract.mobility_amount_cents ?? 0) > 0 ? (
              <InfoRow
                label="Movilidad incluida"
                value={formatCurrencyFromCents(contract.mobility_amount_cents)}
              />
            ) : null}
            <InfoRow label="Pagado" value={formatCurrencyFromCents(paid)} />
            <InfoRow
              label="Saldo"
              value={formatCurrencyFromCents(balance)}
            />
          </View>

          <View className="mt-4">
            <View className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <View
                className="h-full rounded-full bg-success"
                style={{ width: `${progress}%` }}
              />
            </View>
            <AppText className="mt-2 text-label text-ink-muted">
              {progress}% del monto acordado
            </AppText>
          </View>
        </SectionCard>

        {contract.client_visible_notes || contract.internal_notes ? (
          <SectionCard className="mt-4" title="Notas">
            <View className="gap-4">
              {contract.client_visible_notes ? (
                <View>
                  <AppText className="text-label font-semibold text-ink">
                    Visibles para el cliente
                  </AppText>
                  <AppText className="mt-1 text-body text-ink-muted">
                    {contract.client_visible_notes}
                  </AppText>
                </View>
              ) : null}
              {contract.internal_notes ? (
                <View>
                  <AppText className="text-label font-semibold text-ink">
                    Internas
                  </AppText>
                  <AppText className="mt-1 text-body text-ink-muted">
                    {contract.internal_notes}
                  </AppText>
                </View>
              ) : null}
            </View>
          </SectionCard>
        ) : null}

        {hasActions ? (
          <SectionCard className="mt-4" title="Acciones">
            <View className="gap-3">
              {status === 'draft' ? (
                <>
                  <PrimaryButton
                    label="Editar borrador"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/contracts/[id]/edit',
                        params: { id: contractId },
                      })
                    }
                  />
                  <PrimaryButton
                    label="Confirmar contrato"
                    loading={confirmMutation.isPending}
                    onPress={requestConfirm}
                  />
                  <PrimaryButton
                    label="Cancelar contrato"
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onPress={() => openModal('cancel')}
                  />
                  <PrimaryButton
                    label="Eliminar borrador"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onPress={requestDelete}
                  />
                </>
              ) : null}

              {status === 'pending_signature' ? (
                <>
                  <PrimaryButton
                    label="Marcar como firmado"
                    loading={signMutation.isPending}
                    onPress={() => openModal('sign')}
                  />
                  <PrimaryButton
                    label="Cancelar contrato"
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onPress={() => openModal('cancel')}
                  />
                </>
              ) : null}

              {status === 'signed' ? (
                <>
                  <PrimaryButton
                    label="Anular y crear reemplazo"
                    variant="danger"
                    loading={annulMutation.isPending}
                    onPress={() => openModal('annul')}
                  />
                  <PrimaryButton
                    label="Archivar contrato"
                    variant="secondary"
                    loading={archiveMutation.isPending}
                    onPress={requestArchive}
                  />
                </>
              ) : null}

              {status === 'cancelled' || status === 'annulled' ? (
                <PrimaryButton
                  label="Archivar contrato"
                  variant="secondary"
                  loading={archiveMutation.isPending}
                  onPress={requestArchive}
                />
              ) : null}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard className="mt-4" title="Pagos">
          {paymentsQuery.isError ? (
            <View className="gap-3">
              <ErrorBanner message={paymentsQuery.error.message} />
              <PrimaryButton
                label="Reintentar"
                variant="secondary"
                onPress={() => {
                  void paymentsQuery.refetch();
                }}
              />
            </View>
          ) : (
            <PaymentList
              payments={paymentsQuery.data ?? []}
              loading={paymentsQuery.isPending}
            />
          )}

          {canPay ? (
            <PrimaryButton
              className="mt-4"
              label="Registrar pago"
              variant="secondary"
              onPress={() => openModal('payment')}
            />
          ) : null}
        </SectionCard>

        <SectionCard className="mt-4" title="Historial">
          {auditQuery.isError ? (
            <View className="gap-3">
              <ErrorBanner message={auditQuery.error.message} />
              <PrimaryButton
                label="Reintentar"
                variant="secondary"
                onPress={() => {
                  void auditQuery.refetch();
                }}
              />
            </View>
          ) : (
            <AuditHistory
              entries={auditQuery.data ?? []}
              loading={auditQuery.isPending}
            />
          )}
        </SectionCard>
      </ScrollView>

      <ModalSheet
        visible={modal === 'sign'}
        title="Marcar como firmado"
        description="Registra el nombre de quien confirma la firma."
        onClose={() => setModal(null)}
        footer={
          <PrimaryButton
            label="Confirmar firma"
            loading={signMutation.isPending}
            onPress={() => {
              void executeSign();
            }}
          />
        }>
        <View className="gap-4">
          {modalError ? <ErrorBanner message={modalError} /> : null}
          <TextField
            label="Nombre de quien firma"
            required
            value={signedByName}
            onChangeText={setSignedByName}
            placeholder="Nombre completo"
          />
        </View>
      </ModalSheet>

      <ModalSheet
        visible={modal === 'cancel'}
        title="Cancelar contrato"
        description="El contrato cancelado conserva su número si ya lo tenía."
        onClose={() => setModal(null)}
        footer={
          <PrimaryButton
            label="Cancelar contrato"
            variant="danger"
            loading={cancelMutation.isPending}
            onPress={() => {
              void executeCancel();
            }}
          />
        }>
        <View className="gap-4">
          {modalError ? <ErrorBanner message={modalError} /> : null}
          <TextField
            label="Motivo"
            required
            value={reason}
            onChangeText={setReason}
            placeholder="Explica el motivo de la cancelación"
            multiline
          />
        </View>
      </ModalSheet>

      <ModalSheet
        visible={modal === 'annul'}
        title="Anular y reemplazar"
        description="Se anulará el contrato firmado y se creará un borrador enlazado con los mismos datos."
        onClose={() => setModal(null)}
        footer={
          <PrimaryButton
            label="Anular y crear reemplazo"
            variant="danger"
            loading={annulMutation.isPending}
            onPress={() => {
              void executeAnnul();
            }}
          />
        }>
        <View className="gap-4">
          {modalError ? <ErrorBanner message={modalError} /> : null}
          <TextField
            label="Motivo de la anulación"
            required
            value={reason}
            onChangeText={setReason}
            placeholder="Explica el motivo de la anulación"
            multiline
          />
        </View>
      </ModalSheet>

      <PaymentForm
        visible={modal === 'payment'}
        contractId={contractId}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          Alert.alert('Pago registrado', 'El saldo del contrato se actualizó.');
        }}
      />
    </Screen>
  );
}
