import { Linking, Platform, Share } from 'react-native';

import type { ReviewSummary, SpotReview } from './reviews';
import type { StudySpot } from './studySpots';

export type SocialNetwork = 'x' | 'facebook' | 'whatsapp';

// Everything needed to draw the shareable image card.
export type ShareCardData = {
  spotName: string;
  rating: number | null;
  ratingLabel: string;
  quote: string | null;
  quoteAuthor: string | null;
  details: string;
};

export type ShareContent = {
  title: string;
  message: string;
  url: string;
  card: ShareCardData;
};

export function getSpotMapUrl(spot: StudySpot): string {
  return `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
}

function formatStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function getSpotDetails(spot: StudySpot): string {
  const noise =
    spot.noise_level.charAt(0).toUpperCase() + spot.noise_level.slice(1);

  return `${noise} · ${spot.walk_minutes} min walk · ${spot.total_seats} seats`;
}

export function getSpotShareContent(
  spot: StudySpot,
  summary?: ReviewSummary
): ShareContent {
  const rating = summary
    ? ` (rated ${summary.average.toFixed(1)}★ from ${summary.count} review${summary.count === 1 ? '' : 's'})`
    : '';

  return {
    title: spot.name,
    message: `I'm studying at ${spot.name}${rating}, found on StudySpot 📚`,
    url: getSpotMapUrl(spot),
    card: {
      spotName: spot.name,
      rating: summary?.average ?? null,
      ratingLabel: summary
        ? `${summary.average.toFixed(1)} · ${summary.count} review${summary.count === 1 ? '' : 's'}`
        : 'New on StudySpot',
      quote: null,
      quoteAuthor: null,
      details: getSpotDetails(spot),
    },
  };
}

export function getReviewShareContent(
  spot: StudySpot,
  review: SpotReview,
  isOwnReview: boolean
): ShareContent {
  const comment = review.comment.trim();
  const shortComment =
    comment.length > 180 ? `${comment.slice(0, 177)}…` : comment;
  const intro = isOwnReview
    ? `I rated ${spot.name}`
    : `${review.author_name} rated ${spot.name}`;

  return {
    title: `Review of ${spot.name}`,
    message: `${intro} ${formatStars(review.rating)} on StudySpot${shortComment ? `: "${shortComment}"` : ''} 📚`,
    url: getSpotMapUrl(spot),
    card: {
      spotName: spot.name,
      rating: review.rating,
      ratingLabel: `${review.rating}/5`,
      quote: comment || null,
      quoteAuthor: review.author_name,
      details: getSpotDetails(spot),
    },
  };
}

export function getSocialShareUrl(
  network: SocialNetwork,
  message: string,
  url: string
): string {
  const text = encodeURIComponent(message);
  const link = encodeURIComponent(url);

  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${text}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`;
  }
}

export async function shareToNetwork(
  network: SocialNetwork,
  content: ShareContent
): Promise<void> {
  const url = getSocialShareUrl(network, content.message, content.url);

  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Linking.openURL(url);
}

export type SystemShareResult =
  | 'shared'
  | 'copied'
  | 'downloaded'
  | 'dismissed';

// Opens the device share sheet (Instagram, Messages, etc.).
// Browsers without the Web Share API get the link copied instead.
export async function shareWithSystemSheet(
  content: ShareContent
): Promise<SystemShareResult> {
  if (Platform.OS === 'web') {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return 'shared';
      } catch {
        return 'dismissed';
      }
    }

    await navigator.clipboard.writeText(
      `${content.message} ${content.url}`
    );
    return 'copied';
  }

  const result = await Share.share({
    title: content.title,
    // Android ignores `url`, so include it in the message.
    message:
      Platform.OS === 'ios'
        ? content.message
        : `${content.message} ${content.url}`,
    url: content.url,
  });

  return result.action === Share.dismissedAction
    ? 'dismissed'
    : 'shared';
}
