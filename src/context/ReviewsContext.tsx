import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import {
  createReview,
  deleteReview,
  fetchReviews,
  type NewSpotReview,
  type ReviewSummary,
  type SpotReview,
  summariseReviews,
  updateReview,
} from '../services/reviews';

type ReviewsContextValue = {
  reviews: SpotReview[];
  summaries: Record<string, ReviewSummary>;
  loading: boolean;
  error: string | null;
  reviewsForSpot: (spotId: string) => SpotReview[];
  submitReview: (review: NewSpotReview) => Promise<SpotReview>;
  editReview: (
    reviewId: string,
    review: NewSpotReview
  ) => Promise<SpotReview>;
  removeReview: (reviewId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const ReviewsContext = createContext<
  ReviewsContextValue | undefined
>(undefined);

export function ReviewsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setError(null);

      const records = await fetchReviews();

      setReviews(records);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load reviews'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();

    const channel = supabase
      .channel('spot-reviews-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spot_reviews',
        },
        () => {
          void loadReviews();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadReviews]);

  const submitReview = useCallback(
    async (review: NewSpotReview) => {
      const created = await createReview(review);

      // Show the new review straight away; the realtime
      // subscription will reconcile with the server.
      setReviews((currentReviews) =>
        currentReviews.some((r) => r.id === created.id)
          ? currentReviews
          : [created, ...currentReviews]
      );

      return created;
    },
    []
  );

  const editReview = useCallback(
    async (reviewId: string, review: NewSpotReview) => {
      const updated = await updateReview(reviewId, review);

      setReviews((currentReviews) =>
        currentReviews.map((r) => (r.id === updated.id ? updated : r))
      );

      return updated;
    },
    []
  );

  const removeReview = useCallback(async (reviewId: string) => {
    await deleteReview(reviewId);

    setReviews((currentReviews) =>
      currentReviews.filter((r) => r.id !== reviewId)
    );
  }, []);

  const summaries = useMemo(
    () => summariseReviews(reviews),
    [reviews]
  );

  const reviewsForSpot = useCallback(
    (spotId: string) =>
      reviews.filter((review) => review.spot_id === spotId),
    [reviews]
  );

  const value = useMemo(
    () => ({
      reviews,
      summaries,
      loading,
      error,
      reviewsForSpot,
      submitReview,
      editReview,
      removeReview,
      refresh: loadReviews,
    }),
    [
      reviews,
      summaries,
      loading,
      error,
      reviewsForSpot,
      submitReview,
      editReview,
      removeReview,
      loadReviews,
    ]
  );

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);

  if (!context) {
    throw new Error(
      'useReviews must be used inside ReviewsProvider'
    );
  }

  return context;
}
