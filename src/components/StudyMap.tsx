import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Camera,
  Layer,
  Map,
  ViewAnnotation,
  type LayerSpecification,
} from '@maplibre/maplibre-react-native';

import { UTS_MAP_CENTER } from '../data/mapSpots';
import type { StudySpot } from '../services/studySpots';
import { COLORS } from '../theme';

type StudyMapProps = {
  spots: StudySpot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const MAP_STYLE =
  'https://tiles.openfreemap.org/styles/liberty';

const CROWD_COLORS = {
  quiet: COLORS.green,
  moderate: COLORS.amber,
  busy: COLORS.pink,
};

const BUILDING_LAYER: LayerSpecification = {
  id: 'studyspot-3d-buildings',
  type: 'fill-extrusion',
  source: 'openmaptiles',
  'source-layer': 'building',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': '#252938',
    'fill-extrusion-height': [
      'coalesce',
      ['get', 'render_height'],
      ['get', 'height'],
      8,
    ],
    'fill-extrusion-base': [
      'coalesce',
      ['get', 'render_min_height'],
      0,
    ],
    'fill-extrusion-opacity': 0.88,
  },
};

export default function StudyMap({
  spots,
  selectedId,
  onSelect,
}: StudyMapProps) {
  return (
    <Map
      style={styles.map}
      mapStyle={MAP_STYLE}
      onPress={() => onSelect(null)}
    >
      <Camera
        initialViewState={{
          center: UTS_MAP_CENTER,
          zoom: 15.5,
          pitch: 60,
          bearing: -20,
        }}
      />

      <Layer {...BUILDING_LAYER} />

      {spots.map((spot) => {
        const isSelected = selectedId === spot.id;
        const colour =
          CROWD_COLORS[spot.crowd_level];

        return (
          <ViewAnnotation
            key={spot.id}
            id={`study-spot-${spot.id}`}
            lngLat={[
              spot.longitude,
              spot.latitude,
            ]}
            anchor="bottom"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={spot.name}
              onPress={(event) => {
                event.stopPropagation();
                onSelect(spot.id);
              }}
              style={[
                styles.markerOuter,
                isSelected &&
                  styles.markerOuterSelected,
              ]}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: colour,
                    width: isSelected ? 28 : 22,
                    height: isSelected ? 28 : 22,
                    borderRadius: isSelected
                      ? 14
                      : 11,
                  },
                ]}
              />
            </Pressable>
          </ViewAnnotation>
        );
      })}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuterSelected: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${COLORS.purple}55`,
  },
  marker: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 6,
  },
});