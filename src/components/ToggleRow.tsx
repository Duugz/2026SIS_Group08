import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { COLORS } from '../theme';

type ToggleRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: ToggleRowProps) {
  const toggleValue = () => {
    onValueChange(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={toggleValue}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>

        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.surfaceMuted,
          true: COLORS.purple,
        }}
        thumbColor={COLORS.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 18,
    paddingVertical: 13,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,

    backgroundColor: COLORS.glassStrong,

    gap: 16,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  containerPressed: {
    opacity: 0.82,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
});