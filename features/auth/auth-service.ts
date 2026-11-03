import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { getSupabase } from '@/lib/supabase';

import { toAuthOperationError } from './auth-errors';
import type { LoginValues } from './schemas';

export async function signInWithPassword(values: LoginValues): Promise<Session> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    throw toAuthOperationError(error);
  }
  if (!data.session) {
    throw toAuthOperationError(new Error('No se pudo iniciar la sesión.'));
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw toAuthOperationError(error);
  }
}

export async function clearLocalSession(): Promise<void> {
  const { error } = await getSupabase().auth.signOut({ scope: 'local' });
  if (error) {
    throw toAuthOperationError(error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = Linking.createURL('reset-password');
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw toAuthOperationError(error);
  }
}

export async function exchangeRecoveryCode(code: string): Promise<Session> {
  const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);

  if (error) {
    throw toAuthOperationError(error);
  }
  if (!data.session) {
    throw toAuthOperationError(new Error('El enlace de recuperación no es válido.'));
  }

  return data.session;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password });

  if (error) {
    throw toAuthOperationError(error);
  }
}
