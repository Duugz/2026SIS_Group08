import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import SignInButtons from '../components/SignInButtons';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import { useStudySpots } from '../context/StudySpotsContext';
import { COLORS } from '../theme';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
};

export default function ProfileScreen() {
  const { profile, loading, signOut } = useAuth();
  const { reviews } = useReviews();
  const { spots } = useStudySpots();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const myReviews = profile
    ? reviews.filter((review) => review.user_id === profile.id)
    : [];

  const spotName = (spotId: string) =>
    spots.find((spot) => spot.id === spotId)?.name ?? 'Study spot';

  const handleSignOut = async () => {
    setSignOutError(null);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.purple} />
        ) : profile ? (
          <>
            <View style={styles.card}>
              <View style={styles.accountRow}>
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.accountText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {profile.name}
                  </Text>

                  <Text style={styles.subtitle}>
                    Signed in with{' '}
                    {PROVIDER_LABELS[profile.provider ?? ''] ??
                      profile.provider ??
                      'email'}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void handleSignOut();
                }}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={16}
                  color={COLORS.textPrimary}
                />
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>

              {signOutError && (
                <Text style={styles.error}>{signOutError}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>
              My reviews ({myReviews.length})
            </Text>

            {myReviews.length === 0 && (
              <Text style={styles.subtitle}>
                Open a spot on the Map and tap Reviews to write your first one.
              </Text>
            )}

            {myReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewSpot} numberOfLines={1}>
                    {spotName(review.spot_id)}
                  </Text>

                  <StarRating value={review.rating} size={12} />
                </View>

                {review.comment.length > 0 && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.signInIcon}>
              <Ionicons name="person-outline" size={24} color={COLORS.purple} />
            </View>

            <Text style={styles.name}>Sign in to StudySpot</Text>

            <Text style={styles.subtitle}>
              Post reviews with your name and photo, edit them later, and keep
              track of the spots you’ve reviewed.
            </Text>

            <SignInButtons />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.purple}30`,
  },
  avatarText: {
    color: COLORS.purple,
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  accountText: {
    flex: 1,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  signInIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.purple}20`,
  },
  signOutButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  signOutText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  error: {
    color: COLORS.pink,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewSpot: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  reviewComment: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  pressed: {
    opacity: 0.75,
  },
});
