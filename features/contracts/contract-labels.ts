import type {
  ContractStatus,
  EventType,
  PaymentKind,
  PaymentMethod,
} from './contract-types';

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Borrador',
  pending_signature: 'Por firmar',
  signed: 'Firmado',
  cancelled: 'Cancelado',
  annulled: 'Anulado',
  archived: 'Archivado',
};

export const CONTRACT_STATUS_BADGE_CLASSES: Record<ContractStatus, string> = {
  draft: 'border-border bg-surface-muted',
  pending_signature: 'border-warning bg-surface-muted',
  signed: 'border-success bg-surface-muted',
  cancelled: 'border-danger bg-surface-muted',
  annulled: 'border-danger bg-surface-muted',
  archived: 'border-border bg-surface-muted',
};

export const CONTRACT_STATUS_TEXT_CLASSES: Record<ContractStatus, string> = {
  draft: 'text-ink-muted',
  pending_signature: 'text-warning',
  signed: 'text-success',
  cancelled: 'text-danger',
  annulled: 'text-danger',
  archived: 'text-ink-muted',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  children_show: 'Show infantil',
  private_show: 'Show privado',
  hora_loca: 'Hora loca',
  other: 'Otro',
};

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  deposit: 'Adelanto',
  balance: 'Saldo',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  bank_transfer: 'Transferencia',
  other: 'Otro',
};

export const FILTER_STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_signature', label: 'Por firmar' },
  { value: 'signed', label: 'Firmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'annulled', label: 'Anulado' },
  { value: 'archived', label: 'Archivado' },
];

export const EVENT_TYPE_OPTIONS = (
  Object.keys(EVENT_TYPE_LABELS) as EventType[]
).map((value) => ({ value, label: EVENT_TYPE_LABELS[value] }));

export const PAYMENT_KIND_OPTIONS = (
  Object.keys(PAYMENT_KIND_LABELS) as PaymentKind[]
).map((value) => ({ value, label: PAYMENT_KIND_LABELS[value] }));

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }));

const AUDIT_LABELS: Record<string, string> = {
  'contract.created': 'Contrato creado',
  'contract.replacement_created': 'Reemplazo creado',
  'contract.confirmed': 'Contrato confirmado',
  'contract.signed': 'Contrato firmado',
  'contract.cancelled': 'Contrato cancelado',
  'contract.annulled': 'Contrato anulado',
  'contract.archived': 'Contrato archivado',
  'contract.updated': 'Contrato actualizado',
  'payment.recorded': 'Pago registrado',
  'document.generated': 'Documento generado',
};

export function auditActionLabel(action: string): string {
  return AUDIT_LABELS[action] ?? 'Cambio registrado';
}

export function contractStatusLabel(status: ContractStatus | null | undefined): string {
  return status ? CONTRACT_STATUS_LABELS[status] : 'Sin estado';
}

export function eventTypeLabel(type: EventType | null | undefined): string {
  return type ? EVENT_TYPE_LABELS[type] : 'Evento';
}
