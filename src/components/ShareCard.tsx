import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ShareCardData } from '../services/sharing';
import { COLORS } from '../theme';

// Story-sized (9:16) card. Every measurement is defined at a
// 360px base width and scaled, so the same layout can be shown
// as a small preview and captured as a full-size image.
// Keep in sync with drawShareCard in services/shareImage.web.ts.
export const CARD_BASE_WIDTH = 360;
export const CARD_ASPECT = 16 / 9;

type ShareCardProps = {
  card: ShareCardData;
  width: number;
};

const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { card, width },
  ref
) {
  const s = width / CARD_BASE_WIDTH;
  const rating = card.rating ?? 0;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        {
          width,
          height: width * CARD_ASPECT,
          padding: 24 * s,
          borderRadius: 18 * s,
        },
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            width: 320 * s,
            height: 320 * s,
            borderRadius: 160 * s,
            top: -120 * s,
            right: -120 * s,
          },
        ]}
      />

      <Text style={[styles.brand, { fontSize: 18 * s, marginTop: 20 * s }]}>
        ⚡ StudySpot
      </Text>

      <View
        style={[
          styles.panel,
          {
            marginTop: 64 * s,
            padding: 22 * s,
            borderRadius: 20 * s,
            gap: 12 * s,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { fontSize: 10 * s }]}>
          STUDY SPOT
        </Text>

        <Text
          numberOfLines={3}
          style={[styles.spotName, { fontSize: 28 * s, lineHeight: 34 * s }]}
        >
          {card.spotName}
        </Text>

        <View style={[styles.starRow, { gap: 4 * s }]}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={
                rating >= star
                  ? 'star'
                  : rating >= star - 0.5
                    ? 'star-half'
                    : 'star-outline'
              }
              size={24 * s}
              color={rating >= star - 0.5 ? COLORS.amber : COLORS.textSecondary}
            />
          ))}

          <Text
            numberOfLines={1}
            style={[styles.ratingLabel, { fontSize: 14 * s, marginLeft: 6 * s }]}
          >
            {card.ratingLabel}
          </Text>
        </View>

        {card.quote && (
          <View style={{ marginTop: 8 * s, gap: 8 * s }}>
            <Text
              numberOfLines={6}
              style={[styles.quote, { fontSize: 15 * s, lineHeight: 22 * s }]}
            >
              “{card.quote}”
            </Text>

            {card.quoteAuthor && (
              <Text style={[styles.quoteAuthor, { fontSize: 13 * s }]}>
                — {card.quoteAuthor}
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.details, { fontSize: 12 * s, marginTop: 8 * s }]}>
          {card.details}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerTitle, { fontSize: 16 * s }]}>
          Find your next study spot
        </Text>

        <Text style={[styles.footerBrand, { fontSize: 14 * s }]}>
          on StudySpot
        </Text>
      </View>
    </View>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#150E24',
  },
  glow: {
    position: 'absolute',
    backgroundColor: `${COLORS.purple}40`,
  },
  brand: {
    color: COLORS.purple,
    fontFamily: 'Poppins_700Bold',
  },
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    letterSpacing: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  spotName: {
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  quote: {
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  quoteAuthor: {
    color: COLORS.purple,
    fontFamily: 'Poppins_600SemiBold',
  },
  details: {
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '8%',
    alignItems: 'center',
  },
  footerTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerBrand: {
    color: COLORS.purple,
    fontFamily: 'Poppins_600SemiBold',
  },
});
