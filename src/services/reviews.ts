import { supabase } from '../lib/supabase';

export type SpotReview = {
  id: string;
  spot_id: string;
  user_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type NewSpotReview = {
  spot_id: string;
  author_name: string;
  rating: number;
  comment: string;
  // Set for signed-in users; guests leave these out.
  user_id?: string | null;
  author_avatar_url?: string | null;
};

export type ReviewSummary = {
  average: number;
  count: number;
};

export const MAX_AUTHOR_LENGTH = 40;
export const MAX_COMMENT_LENGTH = 500;

// PostgREST returns this code when the table doesn't exist yet.
const MISSING_TABLE_CODE = 'PGRST205';

export class ReviewsNotSetUpError extends Error {
  constructor() {
    super(
      'Reviews aren’t set up yet. Run supabase/migrations/20260925_spot_reviews.sql in the Supabase SQL editor.'
    );
  }
}

export async function fetchReviews(): Promise<SpotReview[]> {
  const { data, error } = await supabase
    .from('spot_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toReviewError(error);
  }

  return (data ?? []) as SpotReview[];
}

export function validateReview(
  review: NewSpotReview
): string | null {
  const authorName = review.author_name.trim();

  if (!authorName) {
    return 'Please enter your name.';
  }

  if (authorName.length > MAX_AUTHOR_LENGTH) {
    return `Name must be ${MAX_AUTHOR_LENGTH} characters or fewer.`;
  }

  if (
    !Number.isInteger(review.rating) ||
    review.rating < 1 ||
    review.rating > 5
  ) {
    return 'Please choose a rating from 1 to 5 stars.';
  }

  if (review.comment.trim().length > MAX_COMMENT_LENGTH) {
    return `Review must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
  }

  return null;
}

export async function createReview(
  review: NewSpotReview
): Promise<SpotReview> {
  const validationError = validateReview(review);

  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase
    .from('spot_reviews')
    .insert({
      spot_id: review.spot_id,
      user_id: review.user_id ?? null,
      author_name: review.author_name.trim(),
      author_avatar_url: review.author_avatar_url ?? null,
      rating: review.rating,
      comment: review.comment.trim(),
    })
    .select()
    .single();

  if (error) {
    throw toReviewError(error);
  }

  return data as SpotReview;
}

export async function updateReview(
  reviewId: string,
  review: NewSpotReview
): Promise<SpotReview> {
  const validationError = validateReview(review);

  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase
    .from('spot_reviews')
    .update({
      author_name: review.author_name.trim(),
      author_avatar_url: review.author_avatar_url ?? null,
      rating: review.rating,
      comment: review.comment.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw toReviewError(error);
  }

  return data as SpotReview;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('spot_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    throw toReviewError(error);
  }
}

// Postgres unique-violation code.
const DUPLICATE_CODE = '23505';

function toReviewError(error: {
  code?: string;
  message: string;
}): Error {
  if (error.code === MISSING_TABLE_CODE) {
    return new ReviewsNotSetUpError();
  }

  if (error.code === DUPLICATE_CODE) {
    return new Error('You’ve already reviewed this spot.');
  }

  return new Error(error.message);
}

export function summariseReviews(
  reviews: SpotReview[]
): Record<string, ReviewSummary> {
  const totals: Record<string, { sum: number; count: number }> = {};

  for (const review of reviews) {
    const total = (totals[review.spot_id] ??= { sum: 0, count: 0 });

    total.sum += review.rating;
    total.count += 1;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([spotId, total]) => [
      spotId,
      {
        average: total.sum / total.count,
        count: total.count,
      },
    ])
  );
}
