import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import StudyMap from '../components/StudyMap';
import { useStudySpots } from '../context/StudySpotsContext';
import { useAuth } from '../hooks/useAuth';
import { useCheckIns } from '../hooks/useCheckIns';
import { useFavourites } from '../hooks/useFavourites';
import type { CrowdLevel } from '../services/studySpots';
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
  const [selectedId, setSelectedId] = useState<
    string | null
  >(null);

  const {
    filteredSpots,
    loading,
    error,
    refresh,
  } = useStudySpots();

  const { user } = useAuth();
  const { favouriteIds, toggle: toggleFavourite } = useFavourites();
  const { myCheckIn, checkIn, checkOut, checkInsForSpot } = useCheckIns();

  const selectedSpot =
    filteredSpots.find(
      (spot) => spot.id === selectedId
    ) ?? null;

  const selectedSpotCheckIns = selectedSpot
    ? checkInsForSpot(selectedSpot.id)
    : [];
  const isCheckedInHere =
    selectedSpot !== null && myCheckIn?.spotId === selectedSpot.id;

  useEffect(() => {
    if (
      selectedId &&
      !filteredSpots.some(
        (spot) => spot.id === selectedId
      )
    ) {
      setSelectedId(null);
    }
  }, [filteredSpots, selectedId]);

  const handleSelect = (id: string | null) => {
    setSelectedId((currentId) =>
      currentId === id ? null : id
    );
  };

  const subtitle = loading
    ? 'Loading live study spots...'
    : error
      ? 'Unable to load live study spots'
      : `${filteredSpots.length} matching spots · drag to explore`;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Map</Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {!loading && !error && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>

      <View style={styles.sceneWrap}>
        <StudyMap
          spots={filteredSpots}
          selectedId={selectedId}
          onSelect={handleSelect}
        />

        {loading && (
          <View style={styles.sceneMessage}>
            <Ionicons
              name="cloud-download-outline"
              size={24}
              color={COLORS.purple}
            />

            <Text style={styles.sceneMessageTitle}>
              Loading locations
            </Text>

            <Text style={styles.sceneMessageText}>
              Retrieving the latest study spots
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.sceneMessage}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={COLORS.pink}
            />

            <Text style={styles.sceneMessageTitle}>
              Couldn’t load locations
            </Text>

            <Text style={styles.sceneMessageText}>
              {error}
            </Text>

            <Pressable
              onPress={() => {
                void refresh();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        )}

        {!loading &&
          !error &&
          filteredSpots.length === 0 && (
            <View style={styles.sceneMessage}>
              <Ionicons
                name="search-outline"
                size={24}
                color={COLORS.textSecondary}
              />

              <Text style={styles.sceneMessageTitle}>
                No matching locations
              </Text>

              <Text style={styles.sceneMessageText}>
                Change or clear your Discover filters
              </Text>
            </View>
          )}
      </View>

      <View style={styles.legend}>
        {(Object.keys(CROWD_META) as CrowdLevel[]).map(
          (level) => (
            <View
              key={level}
              style={styles.legendItem}
            >
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
                  `${CROWD_META[selectedSpot.crowd_level].color}26`,
              },
            ]}
          >
            <Ionicons
              name="location"
              size={22}
              color={
                CROWD_META[selectedSpot.crowd_level]
                  .color
              }
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
                      CROWD_META[
                        selectedSpot.crowd_level
                      ].color,
                  },
                ]}
              />

              <Text style={styles.previewMeta}>
                {
                  CROWD_META[
                    selectedSpot.crowd_level
                  ].label
                }
                {' · '}
                {selectedSpot.walk_minutes} min walk
              </Text>
            </View>

            <Text style={styles.previewAvailability}>
              {selectedSpot.available_seats} of{' '}
              {selectedSpot.total_seats} seats available
              {' · '}
              {selectedSpot.is_open ? 'Open' : 'Closed'}
            </Text>

            {selectedSpotCheckIns.length > 0 && (
              <Text
                style={styles.previewCheckIns}
                numberOfLines={1}
              >
                {selectedSpotCheckIns.length} checked in
                {' · '}
                {selectedSpotCheckIns
                  .map((checkIn) => checkIn.displayName ?? 'Someone')
                  .join(', ')}
              </Text>
            )}
          </View>

          {user && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.previewHeart}
              onPress={() => toggleFavourite(selectedSpot.id)}
            >
              <Ionicons
                name={favouriteIds.has(selectedSpot.id) ? 'heart' : 'heart-outline'}
                size={18}
                color={COLORS.pink}
              />
            </TouchableOpacity>
          )}

          {user && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.previewCheckInButton}
              onPress={() =>
                isCheckedInHere
                  ? checkOut()
                  : checkIn(selectedSpot.id)
              }
            >
              <Ionicons
                name={
                  isCheckedInHere
                    ? 'checkmark-circle'
                    : 'checkmark-circle-outline'
                }
                size={18}
                color={
                  isCheckedInHere
                    ? COLORS.green
                    : COLORS.textSecondary
                }
              />
            </TouchableOpacity>
          )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: `${COLORS.green}18`,
    borderWidth: 1,
    borderColor: `${COLORS.green}55`,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.green,
  },
  liveText: {
    color: COLORS.green,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
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
  sceneMessage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 260,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    transform: [
      { translateX: -130 },
      { translateY: -70 },
    ],
  },
  sceneMessageTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 8,
  },
  sceneMessageText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  retryButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    marginTop: 12,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
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
  previewAvailability: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },
  previewCheckIns: {
    color: COLORS.green,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  previewClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  previewHeart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.pink}18`,
  },
  previewCheckInButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.green}18`,
  },
});