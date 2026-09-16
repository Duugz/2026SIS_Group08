import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStudySpots } from '../context/StudySpotsContext';
import { useAuth } from '../hooks/useAuth';
import { useFavourites } from '../hooks/useFavourites';
import { COLORS } from '../theme';

const CROWD_COLORS: Record<string, string> = {
  quiet: COLORS.green,
  moderate: COLORS.amber,
  busy: COLORS.pink,
};

export default function FavouritesScreen() {
  const { user, loading: authLoading } = useAuth();
  const { spots } = useStudySpots();
  const { favouriteIds, loading: favouritesLoading, toggle } = useFavourites();

  const favouriteSpots = useMemo(
    () => spots.filter((spot) => favouriteIds.has(spot.id)),
    [spots, favouriteIds]
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <ActivityIndicator color={COLORS.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Ionicons name="heart-outline" size={32} color={COLORS.textSecondary} />
          <Text style={styles.title}>Sign in to save favourites</Text>
          <Text style={styles.subtitle}>Head to the Profile tab to sign in or create an account</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favourites</Text>
        <Text style={styles.headerSubtitle}>
          {favouriteSpots.length} saved {favouriteSpots.length === 1 ? 'spot' : 'spots'}
        </Text>
      </View>

      {favouritesLoading ? (
        <View style={styles.content}>
          <ActivityIndicator color={COLORS.purple} />
        </View>
      ) : favouriteSpots.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="heart-outline" size={32} color={COLORS.textSecondary} />
          <Text style={styles.title}>No favourites yet</Text>
          <Text style={styles.subtitle}>
            Tap a spot on the Map tab and use the heart icon to save it here
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {favouriteSpots.map((spot) => (
            <View key={spot.id} style={styles.card}>
              <View
                style={[
                  styles.cardThumb,
                  { backgroundColor: `${CROWD_COLORS[spot.crowd_level]}26` },
                ]}
              >
                <Ionicons name="location" size={20} color={CROWD_COLORS[spot.crowd_level]} />
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {spot.name}
                </Text>
                <Text style={styles.cardMeta}>
                  {spot.walk_minutes} min walk · {spot.available_seats}/{spot.total_seats} seats
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggle(spot.id)}
                style={styles.cardHeart}
              >
                <Ionicons name="heart" size={20} color={COLORS.pink} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  title: { color: COLORS.textPrimary, fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: 'Poppins_500Medium', marginBottom: 2 },
  cardMeta: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  cardHeart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
