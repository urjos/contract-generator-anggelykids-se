type SupabaseErrorLike = {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
  details?: string;
};

const MESSAGES: Record<string, string> = {
  contract_not_found: 'El contrato ya no existe.',
  contract_forbidden: 'No tienes permiso para operar este contrato.',
  contract_invalid_transition: 'El contrato cambió de estado. Actualiza la pantalla.',
  contract_version_mismatch:
    'El contrato fue modificado en otro dispositivo. Recarga e inténtalo de nuevo.',
  contract_incomplete: 'Completa la descripción y el monto antes de confirmar.',
  contract_template_unavailable:
    'No hay una plantilla activa. Configúrala en Ajustes antes de continuar.',
  contract_brand_unavailable:
    'Configura los datos de marca antes de confirmar el contrato.',
  contract_number_exhausted: 'Se agotó la numeración disponible de contratos.',
  invalid_input: 'Revisa los datos ingresados e inténtalo de nuevo.',
  replacement_event_invalid: 'El evento de reemplazo no es válido.',
  payment_state_not_allowed: 'No se pueden registrar pagos en este estado.',
  payment_exceeds_total: 'El pago supera el saldo pendiente del contrato.',
  append_only_table: 'Esta operación no está permitida.',
  immutable_table: 'Esta operación no está permitida.',
};

export class ContractOperationError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ContractOperationError';
    this.code = code;
  }
}

function isSupabaseErrorLike(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'status' in error || 'name' in error)
  );
}

export function toContractOperationError(error: unknown): ContractOperationError {
  if (error instanceof ContractOperationError) {
    return error;
  }

  if (!isSupabaseErrorLike(error)) {
    return new ContractOperationError(
      'No pudimos completar la operación. Inténtalo de nuevo.',
    );
  }

  const token = [error.message, error.details].find(
    (value): value is string => typeof value === 'string' && value in MESSAGES,
  );

  if (token) {
    return new ContractOperationError(MESSAGES[token]!, token);
  }

  if (error.code === '42501') {
    return new ContractOperationError(
      'No tienes permiso para realizar esta operación.',
      error.code,
    );
  }

  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return new ContractOperationError(
      'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.',
      error.code,
    );
  }

  return new ContractOperationError(
    'No pudimos completar la operación. Inténtalo de nuevo.',
    error.code,
  );
}
