import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type FavouritesContextValue = {
  favouriteIds: Set<string>;
  loading: boolean;
  error: string | null;
  toggle: (spotId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeUser = useRef(userId);
  activeUser.current = userId;
  const generation = useRef(0);
  const pending = useRef(new Set<string>());
  const idsRef = useRef(favouriteIds);
  idsRef.current = favouriteIds;

  const refresh = useCallback(async () => {
    const version = ++generation.current;
    if (!userId) {
      setFavouriteIds(new Set());
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('favourites').select('spot_id').eq('user_id', userId);
    if (version !== generation.current || activeUser.current !== userId) return;
    if (queryError) {
      setError(queryError.message);
    } else {
      setFavouriteIds(new Set((data ?? []).map(row => row.spot_id as string)));
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    ++generation.current;
    pending.current.clear();
    setFavouriteIds(new Set());
    setError(null);
    if (authLoading) { setLoading(true); return; }
    void refresh();
    return () => { ++generation.current; };
  }, [userId, authLoading, refresh]);

  const toggle = useCallback(async (spotId: string) => {
    if (!userId || pending.current.has(spotId)) return;
    pending.current.add(spotId);
    const wasFavourite = idsRef.current.has(spotId);
    const next = new Set(idsRef.current);
    if (wasFavourite) next.delete(spotId); else next.add(spotId);
    idsRef.current = next;
    setFavouriteIds(next);
    setError(null);

    try {
      const result = wasFavourite
        ? await supabase.from('favourites').delete().eq('user_id', userId).eq('spot_id', spotId)
        : await supabase.from('favourites').upsert({ user_id: userId, spot_id: spotId }, { onConflict: 'user_id,spot_id' });
      if (result.error) throw result.error;
    } catch (e) {
      if (activeUser.current === userId) {
        setError(e instanceof Error ? e.message : 'Could not update favourite');
        await refresh();
      }
    } finally {
      pending.current.delete(spotId);
    }
  }, [userId, refresh]);

  const value = useMemo(() => ({ favouriteIds, loading, error, toggle, refresh }), [favouriteIds, loading, error, toggle, refresh]);
  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavouritesContext() {
  const value = useContext(FavouritesContext);
  if (!value) throw new Error('useFavourites must be used inside FavouritesProvider');
  return value;
}
