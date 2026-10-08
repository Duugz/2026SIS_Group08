import {
  type NavigationProp,
  type ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { useStudySpots } from '../context/StudySpotsContext';
import type { StudySpotFilters } from '../services/studySpots';
import { COLORS } from '../theme';

type ModePreset = Pick<
  StudySpotFilters,
  'maxWalkMinutes' | 'noiseLevel' | 'studyType' | 'facilities'
>;

const CLEARED_PRESET: ModePreset = {
  maxWalkMinutes: null,
  noiseLevel: null,
  studyType: null,
  facilities: [],
};

type StudyMode = {
  preset: ModePreset;
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  softColor: string;
};

const STUDY_MODES: StudyMode[] = [
  {
    key: 'deep-focus',
    preset: { ...CLEARED_PRESET, noiseLevel: 'quiet', studyType: 'solo' },
    title: 'Deep Focus',
    subtitle: 'Silence & minimal distractions',
    icon: 'book-outline',
    color: COLORS.purple,
    softColor: COLORS.purpleSoft,
  },
  {
    key: 'group-work',
    preset: { ...CLEARED_PRESET, studyType: 'group', facilities: ['wifi'] },
    title: 'Group Work',
    subtitle: 'Spaces for teams',
    icon: 'people-outline',
    color: COLORS.blue,
    softColor: COLORS.blueSoft,
  },
  {
    key: 'quick-study',
    preset: { ...CLEARED_PRESET, maxWalkMinutes: 10 },
    title: 'Quick Study',
    subtitle: 'Short & productive',
    icon: 'flash-outline',
    color: COLORS.pink,
    softColor: COLORS.pinkSoft,
  },
  {
    key: 'casual-study',
    preset: { ...CLEARED_PRESET, noiseLevel: 'moderate', facilities: ['food'] },
    title: 'Casual Study',
    subtitle: 'Relaxed spots & good vibes',
    icon: 'cafe-outline',
    color: COLORS.amber,
    softColor: COLORS.amberSoft,
  },
];

function greetingFor(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function presetMatches(filters: StudySpotFilters, preset: ModePreset) {
  return (
    filters.maxWalkMinutes === preset.maxWalkMinutes &&
    filters.noiseLevel === preset.noiseLevel &&
    filters.studyType === preset.studyType &&
    filters.facilities.length === preset.facilities.length &&
    preset.facilities.every((facility) => filters.facilities.includes(facility))
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { filters, filteredSpots, loading, updateFilters } = useStudySpots();
  const { displayName } = useProfile();

  const activeMode = STUDY_MODES.find((mode) => presetMatches(filters, mode.preset));
  const hasQuery = filters.query.trim() !== '';
  const showSummary = Boolean(activeMode) || hasQuery;

  const toggleMode = (mode: StudyMode) => {
    updateFilters(activeMode?.key === mode.key ? CLEARED_PRESET : mode.preset);
  };

  const openMap = () => navigation.navigate('Map');

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIconWrap}>
              <Ionicons
                name="flash"
                size={17}
                color={COLORS.purple}
              />
            </View>

            <Text style={styles.brandText}>
              Study
              <Text style={styles.brandAccent}>
                Spot
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={19}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>
            {greetingFor(new Date())}
            {displayName ? `, ${displayName}` : ''} 👋
          </Text>

          <Text style={styles.subGreeting}>
            Where do you want to study today?
          </Text>
        </View>

        <View style={styles.searchBar}>
          <View style={styles.searchIconWrap}>
            <Ionicons
              name="search"
              size={18}
              color={COLORS.purple}
            />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search location or study spot"
            placeholderTextColor={COLORS.textMuted}
            value={filters.query}
            onChangeText={(query) => updateFilters({ query })}
            onSubmitEditing={openMap}
            returnKeyType="search"
            autoCorrect={false}
          />

          {hasQuery && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => updateFilters({ query: '' })}
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navigateButton}
            onPress={openMap}
            accessibilityLabel="Show results on map"
          >
            <Ionicons
              name="navigate-outline"
              size={18}
              color={COLORS.purple}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Pick your study mode
            </Text>

            <Text style={styles.sectionSubtitle}>
              We’ll tailor spots around your session
            </Text>
          </View>
        </View>

        <View style={styles.modeGrid}>
          {STUDY_MODES.map((mode) => {
            const isSelected =
              activeMode?.key === mode.key;

            return (
              <TouchableOpacity
                key={mode.key}
                activeOpacity={0.82}
                onPress={() => toggleMode(mode)}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor:
                      isSelected
                        ? mode.softColor
                        : COLORS.glassStrong,
                  },
                  isSelected && {
                    borderColor: mode.color,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeIconWrap,
                    {
                      backgroundColor:
                        mode.softColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={24}
                    color={mode.color}
                  />
                </View>

                <View style={styles.modeTextWrap}>
                  <Text style={styles.modeTitle}>
                    {mode.title}
                  </Text>

                  <Text style={styles.modeSubtitle}>
                    {mode.subtitle}
                  </Text>
                </View>

                <View
                  style={[
                    styles.arrowWrap,
                    isSelected && {
                      backgroundColor:
                        `${mode.color}18`,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={
                      isSelected
                        ? mode.color
                        : COLORS.textMuted
                    }
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {showSummary && (
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.resultCard}
            onPress={openMap}
            disabled={loading || filteredSpots.length === 0}
          >
            <View style={styles.quickInfoText}>
              <Text style={styles.quickInfoTitle}>
                {loading
                  ? 'Loading spots...'
                  : `${filteredSpots.length} matching ${
                      filteredSpots.length === 1 ? 'spot' : 'spots'
                    }`}
              </Text>

              <Text style={styles.quickInfoSubtitle}>
                {activeMode ? `${activeMode.title} mode` : 'Search results'}
                {' · '}tap to view on the map
              </Text>
            </View>

            <Ionicons
              name="map-outline"
              size={20}
              color={COLORS.purple}
            />
          </TouchableOpacity>
        )}

        <View style={styles.quickInfoCard}>
          <View style={styles.quickInfoIcon}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={COLORS.purple}
            />
          </View>

          <View style={styles.quickInfoText}>
            <Text style={styles.quickInfoTitle}>
              Find the right vibe faster
            </Text>

            <Text style={styles.quickInfoSubtitle}>
              Filter by noise, distance,
              facilities and study type.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: `${COLORS.purple}12`,
    top: -80,
    right: -80,
  },

  backgroundOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: `${COLORS.blue}10`,
    bottom: 40,
    left: -90,
  },

  scrollContent: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  brandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.purpleVerySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold',
  },

  brandAccent: {
    color: COLORS.purple,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 14,

    backgroundColor: COLORS.glassStrong,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  hero: {
    marginBottom: 22,
  },

  greeting: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    letterSpacing: -0.4,
  },

  subGreeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 56,

    backgroundColor: COLORS.glassStrong,

    borderRadius: 18,

    paddingHorizontal: 12,

    gap: 10,

    marginBottom: 32,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

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

  searchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.purpleVerySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchInput: {
    flex: 1,

    color: COLORS.textPrimary,

    fontFamily: 'Poppins_400Regular',
    fontSize: 14,

    outlineStyle: 'none' as any,
  },

  navigateButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  modeCard: {
    width: '48%',

    minHeight: 138,

    borderRadius: 20,

    padding: 18,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  modeIconWrap: {
    width: 46,
    height: 46,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 14,
  },

  modeTextWrap: {
    paddingRight: 30,
  },

  modeTitle: {
    color: COLORS.textPrimary,

    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',

    marginBottom: 3,
  },

  modeSubtitle: {
    color: COLORS.textSecondary,

    fontSize: 12,
    fontFamily: 'Poppins_400Regular',

    lineHeight: 18,
  },

  arrowWrap: {
    position: 'absolute',

    right: 14,
    top: 14,

    width: 28,
    height: 28,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',
  },

  resultCard: {
    marginTop: 22,
    marginBottom: -6,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.purpleSoft,

    borderRadius: 18,

    padding: 16,

    borderWidth: 1,
    borderColor: COLORS.purple,

    gap: 12,
  },

  quickInfoCard: {
    marginTop: 22,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.glassStrong,

    borderRadius: 18,

    padding: 16,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    gap: 12,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  quickInfoIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: COLORS.purpleVerySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  quickInfoText: {
    flex: 1,
  },

  quickInfoTitle: {
    color: COLORS.textPrimary,

    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  quickInfoSubtitle: {
    color: COLORS.textSecondary,

    fontSize: 11,
    lineHeight: 17,

    fontFamily: 'Poppins_400Regular',

    marginTop: 2,
  },
});