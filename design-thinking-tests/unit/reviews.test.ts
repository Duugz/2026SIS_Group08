import {
  validateReview,
  summariseReviews,
  MAX_AUTHOR_LENGTH,
  MAX_COMMENT_LENGTH,
  type NewSpotReview,
  type SpotReview,
} from './reviews';
import {
  getSocialShareUrl,
  getReviewShareContent,
  getSpotShareContent,
} from './sharing';

const base: NewSpotReview = {
  spot_id: 'spot-1',
  author_name: 'Sahil',
  rating: 4,
  comment: 'Quiet, good Wi-Fi',
};

const review = (spot_id: string, rating: number, extra: Partial<SpotReview> = {}): SpotReview => ({
  id: Math.random().toString(),
  spot_id,
  user_id: null,
  author_name: 'Guest',
  author_avatar_url: null,
  rating,
  comment: '',
  created_at: '2026-10-14T00:00:00Z',
  updated_at: '2026-10-14T00:00:00Z',
  ...extra,
});

const spot = {
  id: 'spot-1',
  name: 'UTS Library Level 5',
  latitude: -33.8836,
  longitude: 151.2008,
  noise_level: 'quiet',
  walk_minutes: 4,
  total_seats: 120,
};

describe('validateReview (input validation)', () => {
  test('accepts a valid review', () => {
    expect(validateReview(base)).toBeNull();
  });
  test('rejects an empty / whitespace-only name', () => {
    expect(validateReview({ ...base, author_name: '   ' })).toBe('Please enter your name.');
  });
  test(`rejects a name longer than ${MAX_AUTHOR_LENGTH} chars`, () => {
    expect(validateReview({ ...base, author_name: 'a'.repeat(41) })).toMatch(/40 characters/);
  });
  test('accepts a name of exactly 40 chars (boundary)', () => {
    expect(validateReview({ ...base, author_name: 'a'.repeat(40) })).toBeNull();
  });
  test.each([0, 6, -1, 3.5, NaN])('rejects rating %p', (r) => {
    expect(validateReview({ ...base, rating: r })).toMatch(/1 to 5 stars/);
  });
  test.each([1, 5])('accepts boundary rating %p', (r) => {
    expect(validateReview({ ...base, rating: r })).toBeNull();
  });
  test(`rejects a comment longer than ${MAX_COMMENT_LENGTH} chars`, () => {
    expect(validateReview({ ...base, comment: 'x'.repeat(501) })).toMatch(/500 characters/);
  });
  test('allows a star-only review (empty comment)', () => {
    expect(validateReview({ ...base, comment: '' })).toBeNull();
  });
  test('treats a script tag as plain text (rendered by <Text>, not HTML)', () => {
    expect(validateReview({ ...base, comment: '<script>alert(1)</script>' })).toBeNull();
  });
});

describe('summariseReviews (average rating per spot)', () => {
  test('returns an empty object for no reviews', () => {
    expect(summariseReviews([])).toEqual({});
  });
  test('averages ratings per spot and counts them', () => {
    const s = summariseReviews([review('a', 5), review('a', 4), review('a', 3), review('b', 1)]);
    expect(s.a).toEqual({ average: 4, count: 3 });
    expect(s.b).toEqual({ average: 1, count: 1 });
  });
  test('handles 100,000 reviews in a single linear pass', () => {
    const many = Array.from({ length: 100_000 }, (_, i) => review(`s${i % 50}`, (i % 5) + 1));
    const t0 = performance.now();
    const s = summariseReviews(many);
    const ms = performance.now() - t0;
    expect(Object.keys(s)).toHaveLength(50);
    expect(s.s0.count).toBe(2000);
    console.log(`summariseReviews: 100,000 reviews in ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(500);
  });
});

describe('sharing (social media integration)', () => {
  test('builds an X (Twitter) intent URL with encoded text', () => {
    const url = getSocialShareUrl('x', 'Rated 5★ & loved it', 'https://maps.example/?q=1,2');
    expect(url.startsWith('https://twitter.com/intent/tweet?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Rated 5★ & loved it'));
    expect(url).not.toContain(' & ');
  });
  test('builds Facebook and WhatsApp share URLs', () => {
    expect(getSocialShareUrl('facebook', 'hi', 'https://x.y')).toMatch(/^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/);
    expect(getSocialShareUrl('whatsapp', 'hi', 'https://x.y')).toBe(
      'https://wa.me/?text=' + encodeURIComponent('hi https://x.y')
    );
  });
  test('shortens long review comments to 180 chars in the share message', () => {
    const c = getReviewShareContent(spot, review('spot-1', 5, { comment: 'y'.repeat(300), author_name: 'Ana' }), false);
    const quoted = c.message.match(/"(.*)"/)![1];
    expect(quoted.length).toBe(178); // 177 chars + ellipsis
    expect(c.message.startsWith('Ana rated UTS Library Level 5 ★★★★★')).toBe(true);
  });
  test('uses first person for your own review', () => {
    const c = getReviewShareContent(spot, review('spot-1', 3), true);
    expect(c.message.startsWith('I rated UTS Library Level 5 ★★★☆☆')).toBe(true);
  });
  test('spot share includes the rating summary and a map link', () => {
    const c = getSpotShareContent(spot, { average: 4.25, count: 4 });
    expect(c.message).toContain('rated 4.3★ from 4 reviews');
    expect(c.url).toBe('https://www.google.com/maps/search/?api=1&query=-33.8836,151.2008');
    expect(c.card.ratingLabel).toBe('4.3 · 4 reviews');
  });
  test('spot with no reviews is labelled "New on StudySpot"', () => {
    expect(getSpotShareContent(spot).card.ratingLabel).toBe('New on StudySpot');
  });
});

import { fetchReviews, createReview, ReviewsNotSetUpError } from './reviews';
import { setNext } from './mocks/supabase';

describe('error handling (friendly messages)', () => {
  test('missing reviews table (PGRST205) shows the setup message, not a crash', async () => {
    setNext({ data: null, error: { code: 'PGRST205', message: 'relation not found' } });
    await expect(fetchReviews()).rejects.toBeInstanceOf(ReviewsNotSetUpError);
  });
  test('duplicate review (Postgres 23505) shows "already reviewed"', async () => {
    setNext({ data: null, error: { code: '23505', message: 'duplicate key value' } });
    await expect(createReview(base)).rejects.toThrow('You’ve already reviewed this spot.');
  });
});
