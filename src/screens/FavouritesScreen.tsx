import { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStudySpots } from '../context/StudySpotsContext';
import { useAuth } from '../hooks/useAuth';
import { useCheckIns } from '../hooks/useCheckIns';
import { useFavourites } from '../hooks/useFavourites';
import { COLORS } from '../theme';

const CROWD_COLORS: Record<string, string> = {
  quiet: COLORS.green,
  moderate: COLORS.amber,
  busy: COLORS.pink,
};

const CROWD_SOFT_COLORS: Record<string, string> = {
  quiet: COLORS.greenSoft,
  moderate: COLORS.amberSoft,
  busy: COLORS.pinkSoft,
};

export default function FavouritesScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const { spots } = useStudySpots();

  const { checkInsForSpot } = useCheckIns();

  const {
    favouriteIds,
    loading: favouritesLoading,
    toggle,
  } = useFavourites();

  const favouriteSpots = useMemo(
    () =>
      spots.filter((spot) =>
        favouriteIds.has(spot.id)
      ),
    [spots, favouriteIds]
  );

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <View style={styles.content}>
          <View style={styles.loadingCard}>
            <ActivityIndicator
              color={COLORS.purple}
            />

            <Text style={styles.loadingText}>
              Loading favourites...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="heart-outline"
                size={30}
                color={COLORS.pink}
              />
            </View>

            <Text style={styles.title}>
              Sign in to save favourites
            </Text>

            <Text style={styles.subtitle}>
              Head to the Profile tab to sign in
              or create an account.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Favourites
          </Text>

          <Text style={styles.headerSubtitle}>
            {favouriteSpots.length} saved{' '}
            {favouriteSpots.length === 1
              ? 'spot'
              : 'spots'}
          </Text>
        </View>

        {favouriteSpots.length > 0 && (
          <View style={styles.headerBadge}>
            <Ionicons
              name="heart"
              size={15}
              color={COLORS.pink}
            />

            <Text style={styles.headerBadgeText}>
              {favouriteSpots.length}
            </Text>
          </View>
        )}
      </View>

      {favouritesLoading ? (
        <View style={styles.content}>
          <View style={styles.loadingCard}>
            <ActivityIndicator
              color={COLORS.purple}
            />

            <Text style={styles.loadingText}>
              Loading favourites...
            </Text>
          </View>
        </View>
      ) : favouriteSpots.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="heart-outline"
                size={30}
                color={COLORS.pink}
              />
            </View>

            <Text style={styles.title}>
              No favourites yet
            </Text>

            <Text style={styles.subtitle}>
              Tap a spot on the Map tab and use
              the heart icon to save it here.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {favouriteSpots.map((spot) => {
            const crowdColor =
              CROWD_COLORS[
                spot.crowd_level
              ];

            const crowdSoftColor =
              CROWD_SOFT_COLORS[
                spot.crowd_level
              ];

            const studyingHere =
              checkInsForSpot(spot.id);

            return (
              <View
                key={spot.id}
                style={styles.card}
              >
                <View
                  style={[
                    styles.cardThumb,
                    {
                      backgroundColor:
                        crowdSoftColor,
                    },
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={crowdColor}
                  />
                </View>

                <View style={styles.cardInfo}>
                  <Text
                    style={styles.cardName}
                    numberOfLines={1}
                  >
                    {spot.name}
                  </Text>

                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.crowdDot,
                        {
                          backgroundColor:
                            crowdColor,
                        },
                      ]}
                    />

                    <Text
                      style={styles.cardMeta}
                    >
                      {spot.walk_minutes} min walk
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.cardAvailability
                    }
                  >
                    {spot.available_seats}/
                    {spot.total_seats} seats
                    available
                  </Text>

                  {studyingHere.length > 0 && (
                    <Text
                      style={
                        styles.cardCheckIns
                      }
                      numberOfLines={1}
                    >
                      {studyingHere.length}{' '}
                      studying here
                      {' · '}
                      {studyingHere
                        .map(
                          (entry) =>
                            entry.displayName ??
                            'Someone'
                        )
                        .join(', ')}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.72}
                  onPress={() =>
                    toggle(spot.id)
                  }
                  style={styles.cardHeart}
                >
                  <Ionicons
                    name="heart"
                    size={19}
                    color={COLORS.pink}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    top: -100,
    right: -90,
  },

  backgroundOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: `${COLORS.blue}0D`,
    bottom: 40,
    left: -80,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },

  headerTitle: {
    color: COLORS.textPrimary,

    fontSize: 26,
    fontFamily: 'Poppins_700Bold',

    letterSpacing: -0.4,

    marginBottom: 2,
  },

  headerSubtitle: {
    color: COLORS.textSecondary,

    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  headerBadge: {
    minWidth: 42,
    height: 36,

    paddingHorizontal: 10,

    borderRadius: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    backgroundColor:
      COLORS.pinkSoft,

    borderWidth: 1,
    borderColor:
      `${COLORS.pink}25`,
  },

  headerBadgeText: {
    color: COLORS.pink,

    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  content: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 24,
  },

  loadingCard: {
    minWidth: 220,

    paddingHorizontal: 24,
    paddingVertical: 22,

    borderRadius: 20,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    gap: 10,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 4,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  emptyCard: {
    width: '100%',
    maxWidth: 420,

    paddingHorizontal: 26,
    paddingVertical: 30,

    borderRadius: 24,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    shadowColor:
      COLORS.shadowStrong,

    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  emptyIconWrap: {
    width: 62,
    height: 62,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.pinkSoft,

    marginBottom: 14,
  },

  title: {
    color: COLORS.textPrimary,

    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',

    textAlign: 'center',

    marginBottom: 6,
  },

  subtitle: {
    color: COLORS.textSecondary,

    fontSize: 12,
    lineHeight: 19,

    fontFamily: 'Poppins_400Regular',

    textAlign: 'center',
  },

  list: {
    width: '100%',
    maxWidth: 760,

    alignSelf: 'center',

    paddingHorizontal: 20,
    paddingBottom: 28,

    gap: 14,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 15,

    borderRadius: 20,

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    gap: 13,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
        }
      : {}),
  },

  cardThumb: {
    width: 50,
    height: 50,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',
  },

  cardInfo: {
    flex: 1,
  },

  cardName: {
    color: COLORS.textPrimary,

    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',

    marginBottom: 4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
  },

  crowdDot: {
    width: 7,
    height: 7,

    borderRadius: 3.5,
  },

  cardMeta: {
    color: COLORS.textSecondary,

    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  cardCheckIns: {
    color: COLORS.green,

    fontSize: 10,
    lineHeight: 16,

    fontFamily: 'Poppins_400Regular',

    marginTop: 2,
  },

  cardAvailability: {
    color: COLORS.textMuted,

    fontSize: 10,
    lineHeight: 16,

    fontFamily: 'Poppins_400Regular',

    marginTop: 2,
  },

  cardHeart: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.pinkSoft,
  },
});