type SupabaseErrorLike = {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
};

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'El correo todavía no está confirmado.',
  over_email_send_rate_limit:
    'Se enviaron demasiados correos. Espera unos minutos antes de intentar de nuevo.',
  over_request_rate_limit:
    'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.',
  weak_password: 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  same_password: 'La nueva contraseña debe ser diferente a la anterior.',
  otp_expired: 'El enlace ya expiró. Solicita uno nuevo.',
  flow_state_expired: 'El enlace ya expiró. Solicita uno nuevo.',
  flow_state_not_found: 'El enlace no es válido. Solicita uno nuevo.',
  session_not_found: 'La sesión ya no es válida. Inicia sesión de nuevo.',
  refresh_token_not_found: 'La sesión ya no es válida. Inicia sesión de nuevo.',
};

export class AuthOperationError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthOperationError';
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

export function toAuthOperationError(error: unknown): AuthOperationError {
  if (error instanceof AuthOperationError) {
    return error;
  }

  if (!isSupabaseErrorLike(error)) {
    return new AuthOperationError('No pudimos completar la operación. Inténtalo de nuevo.');
  }

  const code = error.code;
  if (code) {
    const message = MESSAGES[code];
    if (message) {
      return new AuthOperationError(message, code);
    }
  }

  if (error.status === 429) {
    return new AuthOperationError(
      'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.',
      code,
    );
  }

  if (
    error.status === 0 ||
    error.name === 'AuthRetryableFetchError' ||
    /network|fetch/i.test(error.message ?? '')
  ) {
    return new AuthOperationError(
      'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.',
      code,
    );
  }

  return new AuthOperationError(
    'No pudimos completar la operación. Inténtalo de nuevo.',
    code,
  );
}
