import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

export type SocialProvider = 'google' | 'facebook';

export type AuthProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  provider: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => ReturnType<typeof supabase.auth.signUp>;
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// Closes the sign-in popup on web once it redirects back.
WebBrowser.maybeCompleteAuthSession();

function getRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return window.location.origin;
  }

  return Linking.createURL('auth/callback');
}

// Supabase sends the browser to a raw JSON error page if a provider
// is switched off, so check first and fail with a clear message.
async function assertProviderEnabled(provider: SocialProvider) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    const settings = (await response.json()) as {
      external?: Record<string, boolean>;
    };

    if (settings.external && !settings.external[provider]) {
      throw new Error('Unsupported provider: provider is not enabled');
    }
  } catch (error) {
    if (error instanceof Error && /not enabled/.test(error.message)) {
      throw error;
    }
    // If the check itself fails, let the normal sign-in flow try.
  }
}

export function getProfile(user: User): AuthProfile {
  const metadata = user.user_metadata ?? {};
  const name =
    metadata.full_name ??
    metadata.name ??
    user.email?.split('@')[0] ??
    'StudySpot user';

  return {
    id: user.id,
    name: String(name).slice(0, 40),
    avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
    provider: user.app_metadata?.provider ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // INITIAL_SESSION provides the stored session and later events keep every
    // screen in sync using a single subscription.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'INITIAL_SESSION') setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = useCallback(
    async (provider: SocialProvider) => {
      const redirectTo = getRedirectUrl();

      await assertProviderEnabled(provider);

      if (Platform.OS === 'web') {
        // Full-page redirect; Supabase picks the session up from
        // the URL when the app reloads.
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });

        if (error) {
          throw new Error(error.message);
        }

        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        throw new Error(error?.message ?? 'Unable to start sign-in');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type !== 'success') {
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code;
      const errorDescription = queryParams?.error_description;

      if (typeof errorDescription === 'string') {
        throw new Error(errorDescription);
      }

      if (typeof code !== 'string') {
        throw new Error('Sign-in did not return a code');
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        throw new Error(exchangeError.message);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(
    (email: string, password: string) => supabase.auth.signUp({ email, password }),
    []
  );

  const signIn = useCallback(
    (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    []
  );

  const profile = useMemo(
    () => (session ? getProfile(session.user) : null),
    [session]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signUp,
      signIn,
      signInWithProvider,
      signOut,
    }),
    [session, profile, loading, signUp, signIn, signInWithProvider, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

// hooks/useAuth.ts and older screens import this name.
export const useAuthContext = useAuth;
