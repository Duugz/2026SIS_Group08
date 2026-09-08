export type CrowdLevel = 'quiet' | 'moderate' | 'busy';

export type MapSpot = {
  id: string;
  name: string;
  distance: string;
  crowd: CrowdLevel;
  coordinates: [longitude: number, latitude: number];
};

export const MAP_SPOTS: MapSpot[] = [
  {
    id: '1',
    name: 'UTS Library',
    distance: '5 min walk',
    crowd: 'quiet',
    coordinates: [151.2007, -33.8833],
  },
  {
    id: '2',
    name: 'Central Park Study Area',
    distance: '9 min walk',
    crowd: 'moderate',
    coordinates: [151.1999, -33.8845],
  },
  {
    id: '3',
    name: 'Building 2, Level 7',
    distance: '3 min walk',
    crowd: 'busy',
    coordinates: [151.2006, -33.8835],
  },
  {
    id: '4',
    name: 'Darling Square Library',
    distance: '12 min walk',
    crowd: 'quiet',
    coordinates: [151.2026, -33.8769],
  },
];

export const UTS_MAP_CENTER: [longitude: number, latitude: number] = [
  151.2007,
  -33.8836,
];