import { z } from 'zod';

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
