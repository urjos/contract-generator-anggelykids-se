import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

import { toAuthOperationError } from './auth-errors';
import {
  clearLocalSession,
  exchangeRecoveryCode,
  requestPasswordReset as requestPasswordResetService,
  signInWithPassword,
  signOut as signOutService,
  updatePassword as updatePasswordService,
} from './auth-service';
import type { LoginValues } from './schemas';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'recovery'
  | 'error'
  | 'unconfigured';

export type AuthContextValue = {
  session: Session | null;
  status: AuthStatus;
  restoreError: string | null;
  passwordResetCompleted: boolean;
  clearPasswordResetCompleted: () => void;
  retrySessionRestore: () => Promise<void>;
  signIn: (values: LoginValues) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  beginPasswordRecovery: (code: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unconfigured');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [passwordResetCompleted, setPasswordResetCompleted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const restoreSession = useCallback(async () => {
    const client = supabase;
    if (!client) {
      return;
    }

    try {
      const { data, error } = await client.auth.getSession();
      if (!mountedRef.current) {
        return;
      }
      if (error) {
        if (error.code === 'session_not_found' || error.code === 'refresh_token_not_found') {
          setSession(null);
          setStatus('unauthenticated');
          return;
        }
        throw error;
      }
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');
    } catch (restoreFailure) {
      if (!mountedRef.current) {
        return;
      }
      setSession(null);
      setRestoreError(toAuthOperationError(restoreFailure).message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      return;
    }

    let isActive = true;

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }
        if (error) {
          if (error.code === 'session_not_found' || error.code === 'refresh_token_not_found') {
            setSession(null);
            setStatus('unauthenticated');
            return;
          }
          setSession(null);
          setRestoreError(toAuthOperationError(error).message);
          setStatus('error');
          return;
        }
        setSession(data.session);
        setStatus(data.session ? 'authenticated' : 'unauthenticated');
      })
      .catch((restoreFailure) => {
        if (!isActive) {
          return;
        }
        setSession(null);
        setRestoreError(toAuthOperationError(restoreFailure).message);
        setStatus('error');
      });

    const { data: authListener } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!isActive) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setSession(nextSession);
        setStatus('recovery');
        return;
      }

      setSession(nextSession);
      setStatus((current) => {
        if (current === 'error') {
          return current;
        }
        if (current === 'recovery' && nextSession) {
          return 'recovery';
        }
        return nextSession ? 'authenticated' : 'unauthenticated';
      });
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [restoreSession]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      return;
    }

    if (AppState.currentState === 'active') {
      client.auth.startAutoRefresh();
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, []);

  const retrySessionRestore = useCallback(async () => {
    setRestoreError(null);
    setStatus('loading');
    await restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (values: LoginValues) => {
    const nextSession = await signInWithPassword(values);
    if (!mountedRef.current) {
      return;
    }
    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutService();
    } catch {
      await clearLocalSession();
    }
    if (!mountedRef.current) {
      return;
    }
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await requestPasswordResetService(email);
  }, []);

  const beginPasswordRecovery = useCallback(async (code: string) => {
    setStatus('recovery');
    try {
      const nextSession = await exchangeRecoveryCode(code);
      if (!mountedRef.current) {
        return;
      }
      setSession(nextSession);
      setStatus('recovery');
    } catch (error) {
      if (mountedRef.current) {
        setSession(null);
        setStatus('unauthenticated');
      }
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await updatePasswordService(password);
    setPasswordResetCompleted(true);
    try {
      await signOutService();
    } catch {
      await clearLocalSession().catch(() => undefined);
    }
    if (!mountedRef.current) {
      return;
    }
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const clearPasswordResetCompleted = useCallback(() => {
    setPasswordResetCompleted(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      restoreError,
      passwordResetCompleted,
      clearPasswordResetCompleted,
      retrySessionRestore,
      signIn,
      signOut,
      requestPasswordReset,
      beginPasswordRecovery,
      updatePassword,
    }),
    [
      session,
      status,
      restoreError,
      passwordResetCompleted,
      clearPasswordResetCompleted,
      retrySessionRestore,
      signIn,
      signOut,
      requestPasswordReset,
      beginPasswordRecovery,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
