import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StudyMap from '../components/StudyMap';
import {
  MAP_SPOTS,
  type CrowdLevel,
} from '../data/mapSpots';
import { COLORS } from '../theme';

const CROWD_META: Record<
  CrowdLevel,
  { label: string; color: string }
> = {
  quiet: {
    label: 'Quiet',
    color: COLORS.green,
  },
  moderate: {
    label: 'Moderate',
    color: COLORS.amber,
  },
  busy: {
    label: 'Busy',
    color: COLORS.pink,
  },
};

export default function MapScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSpot =
    MAP_SPOTS.find((spot) => spot.id === selectedId) ?? null;

  const handleSelect = (id: string | null) => {
    setSelectedId((currentId) =>
      currentId === id ? null : id
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>

        <Text style={styles.subtitle}>
          {MAP_SPOTS.length} spots nearby · drag to explore
        </Text>
      </View>

      <View style={styles.sceneWrap}>
        <StudyMap
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </View>

      <View style={styles.legend}>
        {(Object.keys(CROWD_META) as CrowdLevel[]).map(
          (level) => (
            <View key={level} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      CROWD_META[level].color,
                  },
                ]}
              />

              <Text style={styles.legendLabel}>
                {CROWD_META[level].label}
              </Text>
            </View>
          )
        )}
      </View>

      {selectedSpot && (
        <View style={styles.previewCard}>
          <View
            style={[
              styles.previewThumb,
              {
                backgroundColor:
                  `${CROWD_META[selectedSpot.crowd].color}26`,
              },
            ]}
          >
            <Ionicons
              name="location"
              size={22}
              color={CROWD_META[selectedSpot.crowd].color}
            />
          </View>

          <View style={styles.previewInfo}>
            <Text
              style={styles.previewName}
              numberOfLines={1}
            >
              {selectedSpot.name}
            </Text>

            <View style={styles.previewMetaRow}>
              <View
                style={[
                  styles.previewCrowdDot,
                  {
                    backgroundColor:
                      CROWD_META[selectedSpot.crowd].color,
                  },
                ]}
              />

              <Text style={styles.previewMeta}>
                {CROWD_META[selectedSpot.crowd].label}
                {' · '}
                {selectedSpot.distance}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.previewClose}
            onPress={() => setSelectedId(null)}
          >
            <Ionicons
              name="close"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  sceneWrap: {
    flex: 1,
    minHeight: 360,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewCrowdDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  previewMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  previewClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});