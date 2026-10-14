import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { type SocialProvider, useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';

const PROVIDERS: {
  provider: SocialProvider;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { provider: 'google', label: 'Google', icon: 'logo-google', color: '#EA4335' },
  { provider: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
];

// Supabase replies with this when a provider is switched off.
function friendlyError(message: string, label: string): string {
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return `${label} sign-in isn’t switched on yet. Enable it in Supabase → Authentication → Sign In / Providers.`;
  }

  return message;
}

export default function SignInButtons() {
  const { signInWithProvider } = useAuth();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async (provider: SocialProvider, label: string) => {
    setPending(provider);
    setError(null);

    try {
      await signInWithProvider(provider);
    } catch (signInError) {
      setError(
        friendlyError(
          signInError instanceof Error
            ? signInError.message
            : 'Unable to sign in',
          label
        )
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {PROVIDERS.map(({ provider, label, icon, color }) => (
          <Pressable
            key={provider}
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${label}`}
            disabled={pending !== null}
            onPress={() => {
              void handlePress(provider, label);
            }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              pending !== null && pending !== provider && styles.disabled,
            ]}
          >
            {pending === provider ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : (
              <Ionicons name={icon} size={16} color={color} />
            )}

            <Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
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
  label: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  error: {
    color: COLORS.pink,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
