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
import {
  DEFAULT_STUDY_SPOT_FILTERS,
  fetchStudySpots,
  filterStudySpots,
  type StudySpot,
  type StudySpotFilters,
} from '../services/studySpots';

type StudySpotsContextValue = {
  spots: StudySpot[];
  filteredSpots: StudySpot[];
  filters: StudySpotFilters;
  loading: boolean;
  error: string | null;
  updateFilters: (
    updates: Partial<StudySpotFilters>
  ) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
};

const StudySpotsContext = createContext<
  StudySpotsContextValue | undefined
>(undefined);

export function StudySpotsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [spots, setSpots] = useState<StudySpot[]>([]);
  const [filters, setFilters] = useState<StudySpotFilters>(
    DEFAULT_STUDY_SPOT_FILTERS
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSpots = useCallback(async () => {
    try {
      setError(null);

      const records = await fetchStudySpots();

      setSpots(records);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load study spots'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSpots();

    const channel = supabase
      .channel('study-spots-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_spots',
        },
        () => {
          void loadSpots();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSpots]);

  const updateFilters = useCallback(
    (updates: Partial<StudySpotFilters>) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...updates,
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_STUDY_SPOT_FILTERS);
  }, []);

  const filteredSpots = useMemo(
    () => filterStudySpots(spots, filters),
    [spots, filters]
  );

  const value = useMemo(
    () => ({
      spots,
      filteredSpots,
      filters,
      loading,
      error,
      updateFilters,
      clearFilters,
      refresh: loadSpots,
    }),
    [
      spots,
      filteredSpots,
      filters,
      loading,
      error,
      updateFilters,
      clearFilters,
      loadSpots,
    ]
  );

  return (
    <StudySpotsContext.Provider value={value}>
      {children}
    </StudySpotsContext.Provider>
  );
}

export function useStudySpots() {
  const context = useContext(StudySpotsContext);

  if (!context) {
    throw new Error(
      'useStudySpots must be used inside StudySpotsProvider'
    );
  }

  return context;
}