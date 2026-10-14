import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_STUDY_SPOT_FILTERS, fetchStudySpots, filterStudySpots, type StudySpot, type StudySpotFilters } from '../services/studySpots';

type StudySpotsContextValue = {
  spots: StudySpot[];
  filteredSpots: StudySpot[];
  filters: StudySpotFilters;
  loading: boolean;
  error: string | null;
  updateFilters: (updates: Partial<StudySpotFilters>) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
};
const StudySpotsContext = createContext<StudySpotsContextValue | null>(null);

export function StudySpotsProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [filters, setFilters] = useState<StudySpotFilters>(DEFAULT_STUDY_SPOT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  const rerun = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) { rerun.current = true; return; }
    running.current = true;
    do {
      rerun.current = false;
      try {
        if (mounted.current) setError(null);
        const result = await fetchStudySpots();
        if (mounted.current) setSpots(result);
      } catch (err) {
        if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to load study spots');
      } finally {
        if (mounted.current) setLoading(false);
      }
    } while (rerun.current && mounted.current);
    running.current = false;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const channel = supabase.channel('study-spots-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_spots' }, () => { void refresh(); })
      .subscribe();
    return () => { mounted.current = false; void supabase.removeChannel(channel); };
  }, [refresh]);

  const updateFilters = useCallback((updates: Partial<StudySpotFilters>) => setFilters(current => ({ ...current, ...updates })), []);
  const clearFilters = useCallback(() => setFilters({ ...DEFAULT_STUDY_SPOT_FILTERS, facilities: [] }), []);
  const filteredSpots = useMemo(() => filterStudySpots(spots, filters), [spots, filters]);
  const value = useMemo(() => ({ spots, filteredSpots, filters, loading, error, updateFilters, clearFilters, refresh }),
    [spots, filteredSpots, filters, loading, error, updateFilters, clearFilters, refresh]);
  return <StudySpotsContext.Provider value={value}>{children}</StudySpotsContext.Provider>;
}

export function useStudySpots() {
  const context = useContext(StudySpotsContext);
  if (!context) throw new Error('useStudySpots must be used inside StudySpotsProvider');
  return context;
}
