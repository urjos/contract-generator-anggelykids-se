type SupabaseErrorLike = {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
  details?: string;
};

const MESSAGES: Record<string, string> = {
  '23505': 'Ya existe una configuración de marca para esta cuenta.',
  '23502': 'Completa el nombre, el teléfono y el WhatsApp.',
  '23514': 'Revisa los datos de marca ingresados.',
  brand_unauthenticated: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};

export class BrandSettingsError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'BrandSettingsError';
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

export function toBrandSettingsError(error: unknown): BrandSettingsError {
  if (error instanceof BrandSettingsError) {
    return error;
  }

  if (!isSupabaseErrorLike(error)) {
    return new BrandSettingsError(
      'No pudimos guardar los datos de marca. Inténtalo de nuevo.',
    );
  }

  const token = [error.message, error.details].find(
    (value): value is string => typeof value === 'string' && value in MESSAGES,
  );

  if (token) {
    return new BrandSettingsError(MESSAGES[token]!, token);
  }

  if (error.code === '42501') {
    return new BrandSettingsError(
      'No tienes permiso para modificar los datos de marca.',
      error.code,
    );
  }

  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return new BrandSettingsError(
      'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.',
      error.code,
    );
  }

  if (typeof error.message === 'string' && !('code' in error)) {
    return new BrandSettingsError(error.message);
  }

  return new BrandSettingsError(
    'No pudimos guardar los datos de marca. Inténtalo de nuevo.',
    error.code,
  );
}
