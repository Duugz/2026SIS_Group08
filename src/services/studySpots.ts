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
  query: string;
  maxWalkMinutes: number | null;
  noiseLevel: CrowdLevel | null;
  studyType: StudyType | null;
  facilities: Facility[];
  openNow: boolean;
};

export const DEFAULT_STUDY_SPOT_FILTERS: StudySpotFilters = {
  query: '',
  maxWalkMinutes: null,
  noiseLevel: null,
  studyType: null,
  facilities: [],
  openNow: false,
};

const PAGE_SIZE = 500;
const COLUMNS = 'id,slug,name,description,latitude,longitude,walk_minutes,noise_level,crowd_level,study_types,facilities,is_open,available_seats,total_seats,updated_at,created_at';

export async function fetchStudySpots(): Promise<StudySpot[]> {
  const results: StudySpot[] = [];
  // Pagination avoids silently truncating larger data sets at the API row limit.
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase.from('study_spots')
      .select(COLUMNS)
      .order('walk_minutes', { ascending: true })
      .order('id', { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as StudySpot[];
    results.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return results;
}

export function filterStudySpots(
  spots: StudySpot[],
  filters: StudySpotFilters
): StudySpot[] {
  const query = filters.query.trim().toLowerCase();

  return spots.filter((spot) => {
    const matchesQuery =
      query === '' ||
      spot.name.toLowerCase().includes(query) ||
      (spot.description ?? '').toLowerCase().includes(query);

    const matchesDistance =
      filters.maxWalkMinutes === null ||
      spot.walk_minutes <= filters.maxWalkMinutes;

    const matchesNoise =
      filters.noiseLevel === null ||
      spot.noise_level === filters.noiseLevel;

    const matchesStudyType =
      filters.studyType === null ||
      (spot.study_types ?? []).includes(filters.studyType);

    const matchesFacilities = filters.facilities.every(
      (facility) => (spot.facilities ?? []).includes(facility)
    );

    const matchesOpenNow =
      !filters.openNow || spot.is_open;

    return (
      matchesQuery &&
      matchesDistance &&
      matchesNoise &&
      matchesStudyType &&
      matchesFacilities &&
      matchesOpenNow
    );
  });
}
