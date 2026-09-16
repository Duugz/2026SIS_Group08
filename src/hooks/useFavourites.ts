import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Tracks the current user's favourited study spot ids, and gives you a
 * toggle() function to add/remove one. Requires the user to be signed in -
 * favouriteIds is empty and toggle() is a no-op while logged out.
 */
export function useFavourites() {
  const { user } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setFavouriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('favourites')
      .select('spot_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavouriteIds(new Set(data.map((row) => row.spot_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (spotId: string) => {
      if (!user) return;

      const isFavourited = favouriteIds.has(spotId);

      // optimistic update
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        isFavourited ? next.delete(spotId) : next.add(spotId);
        return next;
      });

      const { error } = isFavourited
        ? await supabase
            .from('favourites')
            .delete()
            .eq('user_id', user.id)
            .eq('spot_id', spotId)
        : await supabase.from('favourites').insert({ user_id: user.id, spot_id: spotId });

      if (error) {
        // roll back on failure
        await load();
      }
    },
    [user, favouriteIds, load]
  );

  return { favouriteIds, loading, toggle, refresh: load };
}
