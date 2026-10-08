import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  type NavigationProp,
  type ParamListBase,
  useNavigation,
} from '@react-navigation/native';

import Chip from '../components/Chip';
import SegmentedControl from '../components/SegmentedControl';
import ToggleRow from '../components/ToggleRow';
import { useStudySpots } from '../context/StudySpotsContext';
import {
  type CrowdLevel,
  type Facility,
  type StudyType,
} from '../services/studySpots';
import { COLORS } from '../theme';

const DISTANCE_OPTIONS = [
  'Any',
  '5 min',
  '10 min',
  '20 min',
];

const DISTANCE_VALUES: Record<string, number | null> = {
  Any: null,
  '5 min': 5,
  '10 min': 10,
  '20 min': 20,
};

const NOISE_OPTIONS = [
  'Any',
  'Quiet',
  'Moderate',
  'Busy',
];

const NOISE_VALUES: Record<
  string,
  CrowdLevel | null
> = {
  Any: null,
  Quiet: 'quiet',
  Moderate: 'moderate',
  Busy: 'busy',
};

const NOISE_LABELS: Record<CrowdLevel, string> = {
  quiet: 'Quiet',
  moderate: 'Moderate',
  busy: 'Busy',
};

const STUDY_TYPE_OPTIONS = [
  'Any',
  'Solo',
  'Group',
];

const STUDY_TYPE_VALUES: Record<
  string,
  StudyType | null
> = {
  Any: null,
  Solo: 'solo',
  Group: 'group',
};

const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  solo: 'Solo',
  group: 'Group',
};

const FACILITY_OPTIONS: {
  label: string;
  value: Facility;
}[] = [
  { label: 'Power', value: 'power' },
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Food', value: 'food' },
  { label: 'Toilets', value: 'toilets' },
];

export default function DiscoverScreen() {
  const navigation =
    useNavigation<NavigationProp<ParamListBase>>();

  const {
    filteredSpots,
    filters,
    loading,
    error,
    updateFilters,
    clearFilters,
    refresh,
  } = useStudySpots();

  const distance =
    filters.maxWalkMinutes === null
      ? 'Any'
      : `${filters.maxWalkMinutes} min`;

  const noiseLevel =
    filters.noiseLevel === null
      ? 'Any'
      : NOISE_LABELS[filters.noiseLevel];

  const studyType =
    filters.studyType === null
      ? 'Any'
      : STUDY_TYPE_LABELS[filters.studyType];

  const activeFilterCount =
    (filters.query.trim() !== '' ? 1 : 0) +
    (filters.maxWalkMinutes !== null ? 1 : 0) +
    (filters.noiseLevel !== null ? 1 : 0) +
    (filters.studyType !== null ? 1 : 0) +
    filters.facilities.length +
    (filters.openNow ? 1 : 0);

  const resultCount = filteredSpots.length;

  const toggleFacility = (facility: Facility) => {
    const isSelected =
      filters.facilities.includes(facility);

    updateFilters({
      facilities: isSelected
        ? filters.facilities.filter(
            (currentFacility) =>
              currentFacility !== facility
          )
        : [...filters.facilities, facility],
    });
  };

  const showResults = () => {
    navigation.navigate('Map');
  };

  const buttonDisabled =
    loading || Boolean(error) || resultCount === 0;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Discover
            </Text>

            <Text style={styles.subtitle}>
              Find a study spot that works for you
            </Text>
          </View>

          {activeFilterCount > 0 && (
            <Pressable
              onPress={clearFilters}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={COLORS.purple}
              />

              <Text style={styles.clearButtonText}>
                Clear all
              </Text>
            </Pressable>
          )}
        </View>

        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorContent}>
              <View style={styles.errorIconWrap}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={COLORS.pink}
                />
              </View>

              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>
                  Couldn’t load study spots
                </Text>

                <Text style={styles.errorMessage}>
                  {error}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                void refresh();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.filterCard}>
          <FilterHeading
            icon="walk-outline"
            title="Distance"
            subtitle="How far are you willing to walk?"
          />

          <SegmentedControl
            options={DISTANCE_OPTIONS}
            value={distance}
            onChange={(value) => {
              updateFilters({
                maxWalkMinutes:
                  DISTANCE_VALUES[value],
              });
            }}
          />
        </View>

        <View style={styles.filterCard}>
          <FilterHeading
            icon="volume-medium-outline"
            title="Noise level"
            subtitle="Choose your preferred atmosphere"
          />

          <SegmentedControl
            options={NOISE_OPTIONS}
            value={noiseLevel}
            onChange={(value) => {
              updateFilters({
                noiseLevel:
                  NOISE_VALUES[value],
              });
            }}
          />
        </View>

        <View style={styles.filterCard}>
          <FilterHeading
            icon="people-outline"
            title="Study type"
            subtitle="What kind of session are you planning?"
          />

          <SegmentedControl
            options={STUDY_TYPE_OPTIONS}
            value={studyType}
            onChange={(value) => {
              updateFilters({
                studyType:
                  STUDY_TYPE_VALUES[value],
              });
            }}
          />
        </View>

        <View style={styles.filterCard}>
          <FilterHeading
            icon="options-outline"
            title="Facilities"
            subtitle="Select all the facilities you need"
          />

          <View style={styles.chipContainer}>
            {FACILITY_OPTIONS.map((facility) => (
              <Chip
                key={facility.value}
                label={facility.label}
                selected={filters.facilities.includes(
                  facility.value
                )}
                onPress={() =>
                  toggleFacility(facility.value)
                }
              />
            ))}
          </View>
        </View>

        <ToggleRow
          title="Open now"
          subtitle="Only show locations currently available"
          value={filters.openNow}
          onValueChange={(value) => {
            updateFilters({
              openNow: value,
            });
          }}
        />
      </ScrollView>

      <View style={styles.actionBar}>
        <View style={styles.actionBarContent}>
          <View style={styles.resultSummary}>
            <Text style={styles.resultCount}>
              {loading ? '—' : resultCount}
            </Text>

            <Text style={styles.resultLabel}>
              {loading
                ? 'loading spots'
                : 'matching spots'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: buttonDisabled,
            }}
            disabled={buttonDisabled}
            onPress={showResults}
            style={({ pressed }) => [
              styles.showButton,
              buttonDisabled &&
                styles.showButtonDisabled,
              pressed &&
                !buttonDisabled &&
                styles.showButtonPressed,
            ]}
          >
            <Text style={styles.showButtonText}>
              {loading
                ? 'Loading spots...'
                : `Show ${resultCount} spots`}
            </Text>

            {!loading && (
              <Ionicons
                name="arrow-forward"
                size={18}
                color={COLORS.textOnAccent}
              />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

type FilterHeadingProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

function FilterHeading({
  icon,
  title,
  subtitle,
}: FilterHeadingProps) {
  return (
    <View style={styles.filterHeading}>
      <View style={styles.filterIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.purple}
        />
      </View>

      <View style={styles.filterHeadingText}>
        <Text style={styles.filterTitle}>
          {title}
        </Text>

        <Text style={styles.filterSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
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
    bottom: 50,
    left: -80,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 16,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },

  clearButton: {
    minHeight: 38,
    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    backgroundColor: COLORS.glassStrong,

    gap: 6,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  clearButtonText: {
    color: COLORS.purple,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  pressed: {
    opacity: 0.75,
  },

  errorCard: {
    padding: 16,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: `${COLORS.pink}44`,

    backgroundColor: COLORS.pinkSoft,

    gap: 12,
  },

  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  errorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',
  },

  errorTextContainer: {
    flex: 1,
  },

  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  retryButton: {
    alignSelf: 'flex-start',

    minHeight: 36,

    paddingHorizontal: 14,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: COLORS.pink,
  },

  retryButtonText: {
    color: COLORS.textOnAccent,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  filterCard: {
    padding: 18,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    backgroundColor: COLORS.glassStrong,

    gap: 16,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
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

  filterHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  filterIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.purpleVerySoft,
  },

  filterHeadingText: {
    flex: 1,
  },

  filterTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  filterSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,

    backgroundColor:
      COLORS.glassStrong,

    borderTopWidth: 1,
    borderTopColor:
      COLORS.glassBorder,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: -5,
    },

    elevation: 8,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  actionBarContent: {
    width: '100%',
    maxWidth: 720,

    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    gap: 14,
  },

  resultSummary: {
    minWidth: 76,
  },

  resultCount: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },

  resultLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },

  showButton: {
    flex: 1,
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 16,

    backgroundColor: COLORS.purple,

    gap: 8,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  showButtonDisabled: {
    opacity: 0.45,
  },

  showButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  showButtonText: {
    color: COLORS.textOnAccent,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
});