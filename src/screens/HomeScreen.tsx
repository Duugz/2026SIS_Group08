import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

type StudyMode = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const STUDY_MODES: StudyMode[] = [
  {
    key: 'deep-focus',
    title: 'Deep Focus',
    subtitle: 'Silence & minimal distractions',
    icon: 'book-outline',
    color: COLORS.purple,
  },
  {
    key: 'group-work',
    title: 'Group Work',
    subtitle: 'Spaces for teams',
    icon: 'people-outline',
    color: COLORS.purple,
  },
  {
    key: 'quick-study',
    title: 'Quick Study',
    subtitle: 'Short & productive',
    icon: 'flash-outline',
    color: COLORS.pink,
  },
  {
    key: 'casual-study',
    title: 'Casual Study',
    subtitle: 'Relaxed spots & good vibes',
    icon: 'cafe-outline',
    color: COLORS.amber,
  },
];

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState('quick-study');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Ionicons name="flash" size={18} color={COLORS.amber} />
            <Text style={styles.brandText}>StudySpot</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Good evening, Alex 👋</Text>
        <Text style={styles.subGreeting}>Where do you want to study today?</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or study spot"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="navigate-outline" size={18} color={COLORS.purple} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pick your study mode</Text>

        <View style={styles.modeGrid}>
          {STUDY_MODES.map((mode) => {
            const isSelected = selectedMode === mode.key;
            return (
              <TouchableOpacity
                key={mode.key}
                activeOpacity={0.7}
                style={[
                  styles.modeCard,
                  { backgroundColor: `${mode.color}14` },
                  isSelected && { borderColor: mode.color },
                ]}
                onPress={() => setSelectedMode(mode.key)}
              >
                <View style={[styles.modeIconWrap, { backgroundColor: `${mode.color}26` }]}>
                  <Ionicons name={mode.icon} size={26} color={mode.color} />
                </View>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  subGreeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeCard: {
    width: '47%',
    minHeight: 150,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modeTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  modeSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
});