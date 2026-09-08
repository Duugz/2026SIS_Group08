import { supabase } from '../lib/supabase';

export type CrowdLevel = 'quiet' | 'moderate' | 'busy';
export type StudyType = 'solo' | 'group';
export type Facility = 'power' | 'wifi' | 'food' | 'toilets';

export type StudySpot = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  walk_minutes: number;
  noise_level: CrowdLevel;
  crowd_level: CrowdLevel;
  study_types: StudyType[];
  facilities: Facility[];
  is_open: boolean;
  available_seats: number;
  total_seats: number;
  updated_at: string;
  created_at: string;
};

export type StudySpotFilters = {
  maxWalkMinutes: number | null;
  noiseLevel: CrowdLevel | null;
  studyType: StudyType | null;
  facilities: Facility[];
  openNow: boolean;
};

export const DEFAULT_STUDY_SPOT_FILTERS: StudySpotFilters = {
  maxWalkMinutes: null,
  noiseLevel: null,
  studyType: null,
  facilities: [],
  openNow: false,
};

export async function fetchStudySpots(): Promise<StudySpot[]> {
  const { data, error } = await supabase
    .from('study_spots')
    .select('*')
    .order('walk_minutes', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudySpot[];
}

export function filterStudySpots(
  spots: StudySpot[],
  filters: StudySpotFilters
): StudySpot[] {
  return spots.filter((spot) => {
    const matchesDistance =
      filters.maxWalkMinutes === null ||
      spot.walk_minutes <= filters.maxWalkMinutes;

    const matchesNoise =
      filters.noiseLevel === null ||
      spot.noise_level === filters.noiseLevel;

    const matchesStudyType =
      filters.studyType === null ||
      spot.study_types.includes(filters.studyType);

    const matchesFacilities = filters.facilities.every(
      (facility) => spot.facilities.includes(facility)
    );

    const matchesOpenNow =
      !filters.openNow || spot.is_open;

    return (
      matchesDistance &&
      matchesNoise &&
      matchesStudyType &&
      matchesFacilities &&
      matchesOpenNow
    );
  });
}