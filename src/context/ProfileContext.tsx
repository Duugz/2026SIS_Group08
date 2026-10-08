import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const DISPLAY_NAME_MAX_LENGTH = 30;

type ProfileContextValue = {
  displayName: string | null;
  loading: boolean;
  updateDisplayName: (name: string) => Promise<string | null>;
};

const ProfileContext = createContext<
  ProfileContextValue | undefined
>(undefined);

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setDisplayName(data?.display_name ?? null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Resolves to an error message, or null on success.
  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!userId) return 'Sign in to edit your profile.';

      const trimmed = name.trim();

      if (trimmed.length === 0) {
        return 'Display name can’t be empty.';
      }

      if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
        return `Keep it to ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', userId)
        .select('display_name');

      if (error) return error.message;
      if (!data || data.length === 0) return 'Couldn’t find your profile to update.';

      setDisplayName(trimmed);
      return null;
    },
    [userId]
  );

  const value = useMemo(
    () => ({ displayName, loading, updateDisplayName }),
    [displayName, loading, updateDisplayName]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
}
