import { useEffect, useState } from 'react';
import {
  Platform,
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
  {
    label: string;
    color: string;
    softColor: string;
  }
> = {
  quiet: {
    label: 'Quiet',
    color: COLORS.green,
    softColor: COLORS.greenSoft,
  },
  moderate: {
    label: 'Moderate',
    color: COLORS.amber,
    softColor: COLORS.amberSoft,
  },
  busy: {
    label: 'Busy',
    color: COLORS.pink,
    softColor: COLORS.pinkSoft,
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

  const {
    favouriteIds,
    toggle: toggleFavourite,
  } = useFavourites();

  const {
    myCheckIn,
    checkIn,
    checkOut,
    checkInsForSpot,
  } = useCheckIns();

  const selectedSpot =
    filteredSpots.find(
      (spot) => spot.id === selectedId
    ) ?? null;

  const selectedSpotCheckIns = selectedSpot
    ? checkInsForSpot(selectedSpot.id)
    : [];

  const isCheckedInHere =
    selectedSpot !== null &&
    myCheckIn?.spotId === selectedSpot.id;

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

  const handleSelect = (
    id: string | null
  ) => {
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
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            Map
          </Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {!loading && !error && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>
              Live
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.sceneWrap}>
          <StudyMap
            spots={filteredSpots}
            selectedId={selectedId}
            onSelect={handleSelect}
          />

          {loading && (
            <View style={styles.sceneMessage}>
              <View style={styles.sceneMessageIcon}>
                <Ionicons
                  name="cloud-download-outline"
                  size={24}
                  color={COLORS.purple}
                />
              </View>

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
              <View
                style={[
                  styles.sceneMessageIcon,
                  {
                    backgroundColor:
                      COLORS.pinkSoft,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={COLORS.pink}
                />
              </View>

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
                  pressed &&
                    styles.retryButtonPressed,
                ]}
              >
                <Text
                  style={
                    styles.retryButtonText
                  }
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          )}

          {!loading &&
            !error &&
            filteredSpots.length === 0 && (
              <View style={styles.sceneMessage}>
                <View
                  style={
                    styles.sceneMessageIcon
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={
                      COLORS.textSecondary
                    }
                  />
                </View>

                <Text
                  style={
                    styles.sceneMessageTitle
                  }
                >
                  No matching locations
                </Text>

                <Text
                  style={
                    styles.sceneMessageText
                  }
                >
                  Change or clear your Discover
                  filters
                </Text>
              </View>
            )}

          <View style={styles.legendOverlay}>
            {(Object.keys(
              CROWD_META
            ) as CrowdLevel[]).map(
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
                          CROWD_META[level]
                            .color,
                      },
                    ]}
                  />

                  <Text
                    style={
                      styles.legendLabel
                    }
                  >
                    {
                      CROWD_META[level]
                        .label
                    }
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {selectedSpot && (
          <View style={styles.previewCard}>
            <View
              style={[
                styles.previewThumb,
                {
                  backgroundColor:
                    CROWD_META[
                      selectedSpot.crowd_level
                    ].softColor,
                },
              ]}
            >
              <Ionicons
                name="location"
                size={22}
                color={
                  CROWD_META[
                    selectedSpot.crowd_level
                  ].color
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

              <View
                style={styles.previewMetaRow}
              >
                <View
                  style={[
                    styles.previewCrowdDot,
                    {
                      backgroundColor:
                        CROWD_META[
                          selectedSpot
                            .crowd_level
                        ].color,
                    },
                  ]}
                />

                <Text
                  style={styles.previewMeta}
                >
                  {
                    CROWD_META[
                      selectedSpot
                        .crowd_level
                    ].label
                  }
                  {' · '}
                  {selectedSpot.walk_minutes}{' '}
                  min walk
                </Text>
              </View>

              <Text
                style={
                  styles.previewAvailability
                }
              >
                {selectedSpot.available_seats}{' '}
                of {selectedSpot.total_seats}{' '}
                seats available
                {' · '}
                {selectedSpot.is_open
                  ? 'Open'
                  : 'Closed'}
              </Text>

              {selectedSpotCheckIns.length > 0 && (
                <Text
                  style={styles.previewCheckIns}
                  numberOfLines={1}
                >
                  {selectedSpotCheckIns.length}{' '}
                  checked in
                  {' · '}
                  {selectedSpotCheckIns
                    .map(
                      (entry) =>
                        entry.displayName ??
                        'Someone'
                    )
                    .join(', ')}
                </Text>
              )}
            </View>

            {user && (
              <TouchableOpacity
                activeOpacity={0.72}
                style={styles.previewHeart}
                onPress={() =>
                  toggleFavourite(
                    selectedSpot.id
                  )
                }
              >
                <Ionicons
                  name={
                    favouriteIds.has(
                      selectedSpot.id
                    )
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={18}
                  color={COLORS.pink}
                />
              </TouchableOpacity>
            )}

            {user && (
              <TouchableOpacity
                activeOpacity={0.72}
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
              activeOpacity={0.72}
              style={styles.previewClose}
              onPress={() =>
                setSelectedId(null)
              }
            >
              <Ionicons
                name="close"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },

  backgroundOrbOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: `${COLORS.purple}10`,
    top: -110,
    right: -90,
  },

  backgroundOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: `${COLORS.blue}0D`,
    bottom: 30,
    left: -80,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,

    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: COLORS.textPrimary,

    fontSize: 26,
    fontFamily: 'Poppins_700Bold',

    letterSpacing: -0.4,

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

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 13,

    backgroundColor: COLORS.greenSoft,

    borderWidth: 1,
    borderColor: `${COLORS.green}35`,
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

  mapContainer: {
    flex: 1,
  },

  sceneWrap: {
    flex: 1,

    minHeight: 360,

    marginHorizontal: 20,

    borderRadius: 22,

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    backgroundColor: COLORS.surface,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 6,
  },

  sceneMessage: {
    position: 'absolute',

    top: '50%',
    left: '50%',

    width: 270,

    padding: 20,

    borderRadius: 20,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,

    transform: [
      { translateX: -135 },
      { translateY: -80 },
    ],

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  sceneMessageIcon: {
    width: 46,
    height: 46,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.purpleVerySoft,
  },

  sceneMessageTitle: {
    color: COLORS.textPrimary,

    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',

    marginTop: 10,
  },

  sceneMessageText: {
    color: COLORS.textSecondary,

    fontSize: 11,
    lineHeight: 17,

    textAlign: 'center',

    fontFamily: 'Poppins_400Regular',

    marginTop: 3,
  },

  retryButton: {
    minHeight: 36,

    paddingHorizontal: 15,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: COLORS.purple,

    marginTop: 13,
  },

  retryButtonPressed: {
    opacity: 0.78,
  },

  retryButtonText: {
    color: COLORS.textOnAccent,

    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  legendOverlay: {
    position: 'absolute',

    left: '50%',
    bottom: 14,

    flexDirection: 'row',

    paddingHorizontal: 14,
    paddingVertical: 9,

    gap: 16,

    borderRadius: 15,

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,

    transform: [
      {
        translateX: -113,
      },
    ],

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
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

    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    borderRadius: 20,

    padding: 14,

    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 14,

    gap: 12,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 5,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  previewThumb: {
    width: 50,
    height: 50,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',
  },

  previewInfo: {
    flex: 1,
  },

  previewName: {
    color: COLORS.textPrimary,

    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',

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
    color: COLORS.textMuted,

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
    width: 30,
    height: 30,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.surfaceSoft,
  },

  previewHeart: {
    width: 30,
    height: 30,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.pinkSoft,
  },

  previewCheckInButton: {
    width: 30,
    height: 30,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.greenSoft,
  },
});