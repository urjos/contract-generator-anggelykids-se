import { z } from 'zod';

import {
  normalizePhoneE164,
  parseLimaDateTimeInput,
  parseSolesToCents,
} from '@/lib/format';

import type { DraftPayload } from './contract-types';

export const contractStatusSchema = z.enum([
  'draft',
  'pending_signature',
  'signed',
  'cancelled',
  'annulled',
  'archived',
]);

export const paymentKindSchema = z.enum(['deposit', 'balance']);

export const paymentMethodSchema = z.enum([
  'cash',
  'yape',
  'plin',
  'bank_transfer',
  'other',
]);

const contractIdSchema = z.uuid('El contrato no es válido.');
const expectedVersionSchema = z
  .number()
  .int('La versión debe ser un número entero.')
  .positive('La versión debe ser mayor que cero.');
const timestampSchema = z.string().min(1, 'La fecha no es válida.');

export const confirmContractSchema = z.object({
  contractId: contractIdSchema,
  expectedVersion: expectedVersionSchema,
});

export type ConfirmContractInput = z.infer<typeof confirmContractSchema>;

export const signContractSchema = z.object({
  contractId: contractIdSchema,
  expectedVersion: expectedVersionSchema,
  signedByName: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de quien firma.')
    .max(160, 'El nombre es demasiado largo.'),
  signedAt: timestampSchema.optional(),
});

export type SignContractInput = z.infer<typeof signContractSchema>;

export const cancelContractSchema = z.object({
  contractId: contractIdSchema,
  expectedVersion: expectedVersionSchema,
  reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo de la cancelación.')
    .max(500, 'El motivo es demasiado largo.'),
  cancelledAt: timestampSchema.optional(),
});

export type CancelContractInput = z.infer<typeof cancelContractSchema>;

export const annulAndReplaceContractSchema = z.object({
  contractId: contractIdSchema,
  expectedVersion: expectedVersionSchema,
  reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo de la anulación.')
    .max(500, 'El motivo es demasiado largo.'),
  cancelledAt: timestampSchema.optional(),
  replacementEventId: z.uuid('El evento de reemplazo no es válido.').nullish(),
});

export type AnnulAndReplaceContractInput = z.infer<
  typeof annulAndReplaceContractSchema
>;

export const archiveContractSchema = z.object({
  contractId: contractIdSchema,
  expectedVersion: expectedVersionSchema,
});

export type ArchiveContractInput = z.infer<typeof archiveContractSchema>;

export const recordContractPaymentSchema = z.object({
  contractId: contractIdSchema,
  amountCents: z
    .number()
    .int('El importe debe estar en céntimos.')
    .positive('El importe debe ser mayor que cero.'),
  kind: paymentKindSchema,
  method: paymentMethodSchema,
  paidAt: timestampSchema.optional(),
  note: z.string().trim().max(500, 'La nota es demasiado larga.').nullish(),
});

export type RecordContractPaymentInput = z.infer<
  typeof recordContractPaymentSchema
>;

const contractTransitionRowSchema = z.looseObject({
  id: z.uuid(),
  status: contractStatusSchema,
  version: z.number().int().positive(),
  contract_number: z.number().int().nullable(),
  supersedes_contract_id: z.uuid().nullable(),
});

export const annulAndReplaceResultSchema = z.object({
  annulled_contract: contractTransitionRowSchema,
  replacement_contract: contractTransitionRowSchema,
});

export type AnnulAndReplaceContractResult = z.infer<
  typeof annulAndReplaceResultSchema
>;

export const eventTypeSchema = z.enum([
  'children_show',
  'private_show',
  'hora_loca',
  'other',
]);

export const contractListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  statuses: z.array(contractStatusSchema).optional(),
  includeArchived: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const signFormSchema = z.object({
  signedByName: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de quien firma.')
    .max(160, 'El nombre es demasiado largo.'),
});

export type SignFormValues = z.infer<typeof signFormSchema>;

export const cancelFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo de la cancelación.')
    .max(500, 'El motivo es demasiado largo.'),
});

export type CancelFormValues = z.infer<typeof cancelFormSchema>;

export const paymentFormSchema = z.object({
  amountInput: z
    .string()
    .trim()
    .min(1, 'Ingresa el importe del pago.')
    .refine((value) => {
      const cents = parseSolesToCents(value);
      return cents !== null && cents > 0;
    }, 'Ingresa un importe mayor que cero.'),
  kind: paymentKindSchema,
  method: paymentMethodSchema,
  note: z.string().trim().max(500, 'La nota es demasiado larga.').optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const clientNameSchema = z
  .string()
  .trim()
  .min(2, 'Ingresa el nombre del cliente.')
  .max(160, 'El nombre es demasiado largo.');

const phoneInputSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el celular del cliente.')
  .refine(
    (value) => normalizePhoneE164(value) !== null,
    'Ingresa un celular de 9 dígitos, por ejemplo 999 999 999.',
  );

const startsAtInputSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa la fecha y hora del evento.')
  .refine(
    (value) => parseLimaDateTimeInput(value) !== null,
    'Usa el formato AAAA-MM-DD HH:mm con una fecha válida.',
  );

const totalAmountInputSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el monto acordado.')
  .refine((value) => {
    const cents = parseSolesToCents(value);
    return cents !== null && cents > 0;
  }, 'El monto debe ser mayor que cero.');

const mobilityAmountInputSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }
    const cents = parseSolesToCents(value);
    return cents !== null;
  }, 'Ingresa un monto de movilidad válido.');

const guestCountInputSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }
    return /^\d+$/.test(value) && Number(value) > 0;
  }, 'Ingresa un número de asistentes válido.');

export const draftFormSchema = z
  .object({
    clientId: z.string().optional(),
    clientName: clientNameSchema,
    clientPhone: phoneInputSchema,
    eventType: eventTypeSchema,
    startsAtInput: startsAtInputSchema,
    venueName: z.string().trim().max(120, 'El local es demasiado largo.').optional(),
    venueAddress: z
      .string()
      .trim()
      .min(5, 'Ingresa la dirección del evento.')
      .max(300, 'La dirección es demasiado larga.'),
    district: z.string().trim().max(80, 'El distrito es demasiado largo.').optional(),
    city: z.string().trim().max(80, 'La ciudad es demasiado larga.').optional(),
    guestCountInput: guestCountInputSchema,
    eventNotes: z.string().trim().max(1000, 'Las notas son demasiado largas.').optional(),
    description: z
      .string()
      .trim()
      .min(1, 'Describe el servicio acordado.')
      .max(2000, 'La descripción es demasiado larga.'),
    totalAmountInput: totalAmountInputSchema,
    mobilityAmountInput: mobilityAmountInputSchema,
    clientVisibleNotes: z
      .string()
      .trim()
      .max(1000, 'Las notas visibles son demasiado largas.')
      .optional(),
    internalNotes: z
      .string()
      .trim()
      .max(2000, 'Las notas internas son demasiado largas.')
      .optional(),
    templateId: z.string().optional(),
  })
  .superRefine((values, context) => {
    const total = parseSolesToCents(values.totalAmountInput) ?? 0;
    const mobility = values.mobilityAmountInput
      ? (parseSolesToCents(values.mobilityAmountInput) ?? 0)
      : 0;

    if (mobility > total) {
      context.addIssue({
        code: 'custom',
        path: ['mobilityAmountInput'],
        message: 'La movilidad no puede superar el monto total.',
      });
    }
  });

export type DraftFormValues = z.infer<typeof draftFormSchema>;

function optionalText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function draftFormValuesToPayload(values: DraftFormValues): DraftPayload {
  const phone = normalizePhoneE164(values.clientPhone);
  const startsAt = parseLimaDateTimeInput(values.startsAtInput);
  const totalAmountCents = parseSolesToCents(values.totalAmountInput);
  const mobilityAmountCents = values.mobilityAmountInput
    ? (parseSolesToCents(values.mobilityAmountInput) ?? 0)
    : 0;

  if (!phone || !startsAt || totalAmountCents === null) {
    throw new Error('invalid_input');
  }

  return {
    clientId: values.clientId || null,
    clientName: values.clientName.trim(),
    clientPhone: phone,
    eventType: values.eventType,
    startsAt,
    venueName: optionalText(values.venueName),
    venueAddress: values.venueAddress.trim(),
    district: optionalText(values.district),
    city: optionalText(values.city),
    guestCount: values.guestCountInput
      ? Number(values.guestCountInput)
      : null,
    eventNotes: optionalText(values.eventNotes),
    description: values.description.trim(),
    totalAmountCents,
    mobilityAmountCents,
    clientVisibleNotes: optionalText(values.clientVisibleNotes),
    internalNotes: optionalText(values.internalNotes),
    templateId: values.templateId || null,
  };
}

export const draftPayloadSchema = z.object({
  clientId: z.uuid().nullish(),
  clientName: clientNameSchema,
  clientPhone: z.string().regex(/^\+51\d{9}$/, 'Teléfono inválido.'),
  eventType: eventTypeSchema,
  startsAt: z.string().min(1),
  venueName: z.string().max(120).nullish(),
  venueAddress: z.string().min(5).max(300),
  district: z.string().max(80).nullish(),
  city: z.string().max(80).nullish(),
  guestCount: z.number().int().positive().nullish(),
  eventNotes: z.string().max(1000).nullish(),
  description: z.string().min(1).max(2000),
  totalAmountCents: z.number().int().positive(),
  mobilityAmountCents: z.number().int().min(0),
  clientVisibleNotes: z.string().max(1000).nullish(),
  internalNotes: z.string().max(2000).nullish(),
  templateId: z.uuid().nullish(),
});

export const updateDraftSchema = draftPayloadSchema.extend({
  contractId: z.uuid('El contrato no es válido.'),
  expectedVersion: expectedVersionSchema,
});

export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
