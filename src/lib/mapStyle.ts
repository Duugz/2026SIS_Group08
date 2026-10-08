const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

// MapTiler satellite style when a key is set, otherwise the free OpenFreeMap style.
export const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty';
