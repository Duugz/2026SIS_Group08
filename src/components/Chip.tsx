import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { COLORS } from '../theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function Chip({
  label,
  selected,
  onPress,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 21,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.glassStrong,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  chipSelected: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purple,
  },

  chipPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },

  labelSelected: {
    color: COLORS.textOnAccent,
  },
});