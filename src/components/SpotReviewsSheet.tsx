import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ShareButtons from './ShareButtons';
import ShareCardPreview from './ShareCardPreview';
import SignInButtons from './SignInButtons';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import {
  MAX_AUTHOR_LENGTH,
  MAX_COMMENT_LENGTH,
  type NewSpotReview,
  type SpotReview,
  validateReview,
} from '../services/reviews';
import {
  getReviewShareContent,
  getSpotShareContent,
  type ShareCardData,
} from '../services/sharing';
import type { StudySpot } from '../services/studySpots';
import { COLORS } from '../theme';

type SpotReviewsSheetProps = {
  spot: StudySpot | null;
  visible: boolean;
  onClose: () => void;
};

export default function SpotReviewsSheet({
  spot,
  visible,
  onClose,
}: SpotReviewsSheetProps) {
  const { profile } = useAuth();
  const {
    summaries,
    loading,
    error,
    reviewsForSpot,
    submitReview,
    editReview,
    removeReview,
    refresh,
  } = useReviews();

  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // The guest review just posted, so it can be shared.
  const [postedReviewId, setPostedReviewId] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<ShareCardData | null>(null);
  const [sharingReviewId, setSharingReviewId] = useState<string | null>(null);

  // Start with a fresh form for each spot, but keep the
  // reviewer's name so they don't have to retype it.
  useEffect(() => {
    setRating(0);
    setComment('');
    setEditing(false);
    setFormError(null);
    setPostedReviewId(null);
    setSharingReviewId(null);
  }, [spot?.id, profile?.id]);

  if (!spot) {
    return null;
  }

  const summary = summaries[spot.id];
  const spotReviews = reviewsForSpot(spot.id);
  const ownReview = profile
    ? spotReviews.find((review) => review.user_id === profile.id)
    : undefined;
  const postedReview = postedReviewId
    ? spotReviews.find((review) => review.id === postedReviewId)
    : undefined;
  const showForm = !ownReview || editing;

  const startEditing = (review: SpotReview) => {
    setRating(review.rating);
    setComment(review.comment);
    setFormError(null);
    setEditing(true);
  };

  const handleSubmit = async () => {
    const review: NewSpotReview = profile
      ? {
          spot_id: spot.id,
          user_id: profile.id,
          author_name: profile.name,
          author_avatar_url: profile.avatarUrl,
          rating,
          comment,
        }
      : {
          spot_id: spot.id,
          author_name: authorName,
          rating,
          comment,
        };

    const validationError = validateReview(review);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (ownReview && editing) {
        await editReview(ownReview.id, review);
      } else {
        const created = await submitReview(review);

        if (!profile) {
          setPostedReviewId(created.id);
        }
      }

      setRating(0);
      setComment('');
      setEditing(false);
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to post your review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review: SpotReview) => {
    setFormError(null);

    try {
      await removeReview(review.id);
      setEditing(false);
    } catch (deleteError) {
      setFormError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete your review'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close reviews"
          onPress={onClose}
        />

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetInner}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  {spot.name}
                </Text>

                <View style={styles.summaryRow}>
                  <StarRating value={summary?.average ?? 0} />

                  <Text style={styles.summaryText}>
                    {summary
                      ? `${summary.average.toFixed(1)} · ${summary.count} review${summary.count === 1 ? '' : 's'}`
                      : 'No reviews yet'}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Share this spot</Text>

                <ShareButtons
                  content={getSpotShareContent(spot, summary)}
                  onShareImage={setShareCard}
                />
              </View>

              {ownReview && !editing && (
                <View style={[styles.card, styles.highlightCard]}>
                  <Text style={styles.sectionTitle}>Your review</Text>

                  <ReviewBody review={ownReview} />

                  <Text style={styles.helperText}>
                    Share your review with friends
                  </Text>

                  <ShareButtons
                    content={getReviewShareContent(spot, ownReview, true)}
                    onShareImage={setShareCard}
                  />

                  <View style={styles.ownActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => startEditing(ownReview)}
                      style={({ pressed }) => [
                        styles.textButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color={COLORS.purple}
                      />
                      <Text style={styles.textButtonLabel}>Edit</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        void handleDelete(ownReview);
                      }}
                      style={({ pressed }) => [
                        styles.textButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={COLORS.pink}
                      />
                      <Text style={[styles.textButtonLabel, styles.deleteLabel]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>

                  {formError && (
                    <Text style={styles.formError}>{formError}</Text>
                  )}
                </View>
              )}

              {postedReview && !profile && (
                <View style={[styles.card, styles.highlightCard]}>
                  <Text style={styles.formSuccess}>
                    Thanks! Your review has been posted.
                  </Text>

                  <Text style={styles.sectionTitle}>Share your review</Text>

                  <ShareButtons
                    content={getReviewShareContent(spot, postedReview, true)}
                    onShareImage={setShareCard}
                  />
                </View>
              )}

              {showForm && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    {editing ? 'Edit your review' : 'Write a review'}
                  </Text>

                  {profile ? (
                    <View style={styles.postingAs}>
                      <Avatar
                        name={profile.name}
                        url={profile.avatarUrl}
                        size={28}
                      />

                      <Text style={styles.postingAsText}>
                        Posting as{' '}
                        <Text style={styles.postingAsName}>{profile.name}</Text>
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.signInPrompt}>
                      <Text style={styles.helperText}>
                        Sign in to post with your name and photo, or post as a
                        guest below.
                      </Text>

                      <SignInButtons />
                    </View>
                  )}

                  <StarRating
                    value={rating}
                    size={28}
                    onChange={setRating}
                  />

                  {!profile && (
                    <TextInput
                      value={authorName}
                      onChangeText={setAuthorName}
                      placeholder="Your name"
                      placeholderTextColor={COLORS.textSecondary}
                      maxLength={MAX_AUTHOR_LENGTH}
                      style={styles.input}
                    />
                  )}

                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="How was it? Noise, seats, Wi-Fi…"
                    placeholderTextColor={COLORS.textSecondary}
                    maxLength={MAX_COMMENT_LENGTH}
                    multiline
                    style={[styles.input, styles.commentInput]}
                  />

                  <Text style={styles.counter}>
                    {comment.length}/{MAX_COMMENT_LENGTH}
                  </Text>

                  {formError && (
                    <Text style={styles.formError}>{formError}</Text>
                  )}

                  <View style={styles.formActions}>
                    {editing && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setEditing(false);
                          setFormError(null);
                        }}
                        style={({ pressed }) => [
                          styles.cancelButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                    )}

                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: submitting }}
                      disabled={submitting}
                      onPress={() => {
                        void handleSubmit();
                      }}
                      style={({ pressed }) => [
                        styles.submitButton,
                        submitting && styles.submitButtonDisabled,
                        pressed && !submitting && styles.pressed,
                      ]}
                    >
                      {submitting ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {editing ? 'Save changes' : 'Post review'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>
                Reviews{spotReviews.length > 0 ? ` (${spotReviews.length})` : ''}
              </Text>

              {loading && <ActivityIndicator color={COLORS.purple} />}

              {error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>

                  <Pressable
                    onPress={() => {
                      void refresh();
                    }}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </Pressable>
                </View>
              )}

              {!loading && !error && spotReviews.length === 0 && (
                <Text style={styles.emptyText}>
                  Be the first to review {spot.name}.
                </Text>
              )}

              {spotReviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <ReviewBody
                    review={review}
                    onToggleShare={() =>
                      setSharingReviewId((currentId) =>
                        currentId === review.id ? null : review.id
                      )
                    }
                  />

                  {sharingReviewId === review.id && (
                    <ShareButtons
                      compact
                      content={getReviewShareContent(
                        spot,
                        review,
                        review.user_id !== null && review.user_id === profile?.id
                      )}
                      onShareImage={setShareCard}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <ShareCardPreview card={shareCard} onClose={() => setShareCard(null)} />
    </Modal>
  );
}

function Avatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: number;
}) {
  const [failed, setFailed] = useState(false);
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  if (url && !failed) {
    return (
      <Image
        source={{ uri: url }}
        style={dimensions}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.avatar, dimensions]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function ReviewBody({
  review,
  onToggleShare,
}: {
  review: SpotReview;
  onToggleShare?: () => void;
}) {
  const date = new Date(review.created_at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const edited =
    new Date(review.updated_at).getTime() -
      new Date(review.created_at).getTime() >
    60_000;

  return (
    <View style={styles.reviewBody}>
      <View style={styles.reviewHeader}>
        <Avatar
          name={review.author_name}
          url={review.author_avatar_url}
          size={32}
        />

        <View style={styles.reviewMeta}>
          <View style={styles.reviewAuthorRow}>
            <Text style={styles.reviewAuthor} numberOfLines={1}>
              {review.author_name}
            </Text>

            {review.user_id ? (
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={COLORS.purple}
                accessibilityLabel="Verified account"
              />
            ) : (
              <Text style={styles.guestBadge}>Guest</Text>
            )}
          </View>

          <Text style={styles.reviewDate}>
            {date}
            {edited ? ' · edited' : ''}
          </Text>
        </View>

        <StarRating value={review.rating} size={12} />

        {onToggleShare && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Share ${review.author_name}'s review`}
            hitSlop={6}
            onPress={onToggleShare}
            style={({ pressed }) => [
              styles.reviewShareButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="share-social-outline"
              size={15}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {review.comment.length > 0 && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '88%',
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  sheetInner: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  highlightCard: {
    borderColor: `${COLORS.purple}66`,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  signInPrompt: {
    gap: 10,
  },
  postingAs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postingAsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  postingAsName: {
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  ownActions: {
    flexDirection: 'row',
    gap: 16,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
  },
  textButtonLabel: {
    color: COLORS.purple,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteLabel: {
    color: COLORS.pink,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  commentInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: -6,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  formError: {
    color: COLORS.pink,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  formSuccess: {
    color: COLORS.green,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  submitButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.purple,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  errorCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.pink}66`,
    backgroundColor: `${COLORS.pink}12`,
    gap: 10,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.pink,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  reviewItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  reviewBody: {
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.purple}30`,
  },
  avatarText: {
    color: COLORS.purple,
    fontFamily: 'Poppins_600SemiBold',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewAuthor: {
    flexShrink: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  guestBadge: {
    color: COLORS.textSecondary,
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: 'Poppins_500Medium',
  },
  reviewDate: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  reviewShareButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
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
