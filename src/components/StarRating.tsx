import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme';

type StarRatingProps = {
  value: number;
  size?: number;
  // When provided, the stars become buttons for choosing a rating.
  onChange?: (rating: number) => void;
};

const STARS = [1, 2, 3, 4, 5];

export default function StarRating({
  value,
  size = 14,
  onChange,
}: StarRatingProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole={onChange ? 'radiogroup' : 'image'}
      accessibilityLabel={
        onChange ? 'Rating' : `${value.toFixed(1)} out of 5 stars`
      }
    >
      {STARS.map((star) => {
        const icon =
          value >= star
            ? 'star'
            : value >= star - 0.5
              ? 'star-half'
              : 'star-outline';

        const starIcon = (
          <Ionicons
            name={icon}
            size={size}
            color={
              icon === 'star-outline'
                ? COLORS.textSecondary
                : COLORS.amber
            }
          />
        );

        if (!onChange) {
          return <View key={star}>{starIcon}</View>;
        }

        return (
          <Pressable
            key={star}
            accessibilityRole="radio"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ checked: value === star }}
            hitSlop={4}
            onPress={() => onChange(star)}
            style={({ pressed }) => [
              styles.inputStar,
              pressed && styles.pressed,
            ]}
          >
            {starIcon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inputStar: {
    padding: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
