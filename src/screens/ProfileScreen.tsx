import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../theme';

export default function ProfileScreen() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setFormError('Enter an email and password.');
      return;
    }

    setSubmitting(true);
    const { error } =
      mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (mode === 'sign-up') {
      setInfoMessage('Account created — check your email to confirm, then sign in.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <ActivityIndicator color={COLORS.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={COLORS.purple} />
          </View>
          <Text style={styles.title}>{user.email}</Text>
          <Text style={styles.subtitle}>Signed in</Text>

          <Pressable
            onPress={() => signOut()}
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          >
            <Text style={styles.signOutButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <Text style={styles.title}>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</Text>
        <Text style={styles.subtitle}>Save favourites and personalise your profile</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {formError && <Text style={styles.errorText}>{formError}</Text>}
          {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || submitting) && styles.pressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setFormError(null);
              setInfoMessage(null);
            }}
          >
            <Text style={styles.switchModeText}>
              {mode === 'sign-in'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.purple}26`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 12, textAlign: 'center' },
  form: { width: '100%', gap: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: { color: COLORS.pink, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  infoText: { color: COLORS.green, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  submitButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonText: { color: COLORS.textPrimary, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  switchModeText: {
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 24,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: { color: COLORS.pink, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  pressed: { opacity: 0.7 },
});
