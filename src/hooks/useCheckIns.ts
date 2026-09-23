import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const CHECK_IN_DURATION_MS = 2 * 60 * 60 * 1000;

export type CheckIn = {
  userId: string;
  spotId: string;
  displayName: string | null;
  createdAt: string;
};

type CheckInRow = {
  user_id: string;
  spot_id: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
};

/**
 * Tracks who is currently checked in at each study spot. The list is
 * public (anyone can see who's checked in where); only the signed-in
 * user can check themself in/out. Check-ins expire after 2 hours via the
 * "Active check-ins are publicly readable" RLS policy, so expired rows
 * simply stop showing up here rather than needing client-side filtering.
 */
export function useCheckIns() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('check_ins')
      .select('user_id, spot_id, created_at, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCheckIns(
        (data as unknown as CheckInRow[]).map((row) => ({
          userId: row.user_id,
          spotId: row.spot_id,
          displayName: row.profiles?.display_name ?? null,
          createdAt: row.created_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel('check-ins-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'check_ins' },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const myCheckIn = checkIns.find((checkIn) => checkIn.userId === user?.id) ?? null;

  const checkIn = useCallback(
    async (spotId: string) => {
      if (!user) return;

      await supabase.from('check_ins').upsert({
        user_id: user.id,
        spot_id: spotId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CHECK_IN_DURATION_MS).toISOString(),
      });

      await load();
    },
    [user, load]
  );

  const checkOut = useCallback(async () => {
    if (!user) return;

    await supabase.from('check_ins').delete().eq('user_id', user.id);
    await load();
  }, [user, load]);

  const checkInsForSpot = useCallback(
    (spotId: string) => checkIns.filter((checkIn) => checkIn.spotId === spotId),
    [checkIns]
  );

  return { checkIns, myCheckIn, loading, checkIn, checkOut, checkInsForSpot, refresh: load };
}
