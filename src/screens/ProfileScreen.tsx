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
  const {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [mode, setMode] = useState<
    'sign-in' | 'sign-up'
  >('sign-in');

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [infoMessage, setInfoMessage] =
    useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setFormError(
        'Enter an email and password.'
      );
      return;
    }

    setSubmitting(true);

    const { error } =
      mode === 'sign-in'
        ? await signIn(email, password)
        : await signUp(email, password);

    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (mode === 'sign-up') {
      setInfoMessage(
        'Account created — check your email to confirm, then sign in.'
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <View style={styles.content}>
          <View style={styles.loadingCard}>
            <ActivityIndicator
              color={COLORS.purple}
            />

            <Text style={styles.loadingText}>
              Loading profile...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <View style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={32}
                color={COLORS.purple}
              />
            </View>

            <Text style={styles.title}>
              {user.email}
            </Text>

            <View style={styles.signedInBadge}>
              <View style={styles.signedInDot} />

              <Text style={styles.signedInText}>
                Signed in
              </Text>
            </View>

            <Text style={styles.subtitle}>
              Your favourites and preferences
              are synced to your account.
            </Text>

            <Pressable
              onPress={() => signOut()}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={COLORS.pink}
              />

              <Text
                style={
                  styles.signOutButtonText
                }
              >
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={styles.content}
      >
        <View style={styles.authCard}>
          <View style={styles.authIconWrap}>
            <Ionicons
              name={
                mode === 'sign-in'
                  ? 'person-outline'
                  : 'person-add-outline'
              }
              size={28}
              color={COLORS.purple}
            />
          </View>

          <Text style={styles.title}>
            {mode === 'sign-in'
              ? 'Sign in'
              : 'Create an account'}
          </Text>

          <Text style={styles.subtitle}>
            Save favourites and personalise
            your profile
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <View style={styles.inputIconWrap}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.purple}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={
                  COLORS.textMuted
                }
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrap}>
              <View style={styles.inputIconWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={COLORS.purple}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={
                  COLORS.textMuted
                }
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {formError && (
              <View style={styles.messageError}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.pink}
                />

                <Text style={styles.errorText}>
                  {formError}
                </Text>
              </View>
            )}

            {infoMessage && (
              <View style={styles.messageInfo}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={COLORS.green}
                />

                <Text style={styles.infoText}>
                  {infoMessage}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || submitting) &&
                  styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator
                  color={
                    COLORS.textOnAccent
                  }
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    {mode === 'sign-in'
                      ? 'Sign in'
                      : 'Sign up'}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={
                      COLORS.textOnAccent
                    }
                  />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode(
                  mode === 'sign-in'
                    ? 'sign-up'
                    : 'sign-in'
                );

                setFormError(null);
                setInfoMessage(null);
              }}
            >
              <Text
                style={styles.switchModeText}
              >
                {mode === 'sign-in'
                  ? "Don't have an account? "
                  : 'Already have an account? '}

                <Text
                  style={styles.switchModeLink}
                >
                  {mode === 'sign-in'
                    ? 'Sign up'
                    : 'Sign in'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },

  backgroundOrbOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: `${COLORS.purple}12`,
    top: -110,
    right: -100,
  },

  backgroundOrbTwo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: `${COLORS.blue}0D`,
    bottom: 40,
    left: -90,
  },

  content: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 24,
  },

  authCard: {
    width: '100%',
    maxWidth: 440,

    paddingHorizontal: 24,
    paddingVertical: 28,

    borderRadius: 26,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    shadowColor:
      COLORS.shadowStrong,

    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 6,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
        }
      : {}),
  },

  profileCard: {
    width: '100%',
    maxWidth: 440,

    paddingHorizontal: 24,
    paddingVertical: 30,

    borderRadius: 26,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    shadowColor:
      COLORS.shadowStrong,

    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 6,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
        }
      : {}),
  },

  loadingCard: {
    minWidth: 220,

    paddingHorizontal: 24,
    paddingVertical: 22,

    borderRadius: 20,

    alignItems: 'center',

    backgroundColor:
      COLORS.glassStrong,

    borderWidth: 1,
    borderColor:
      COLORS.glassBorder,

    gap: 10,

    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 4,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  authIconWrap: {
    width: 62,
    height: 62,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.purpleVerySoft,

    marginBottom: 14,
  },

  avatar: {
    width: 72,
    height: 72,

    borderRadius: 24,

    backgroundColor:
      COLORS.purpleVerySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 14,
  },

  title: {
    color: COLORS.textPrimary,

    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',

    textAlign: 'center',
  },

  subtitle: {
    color: COLORS.textSecondary,

    fontSize: 13,
    lineHeight: 20,

    fontFamily: 'Poppins_400Regular',

    marginTop: 5,
    marginBottom: 18,

    textAlign: 'center',
  },

  signedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 8,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor:
      COLORS.greenSoft,

    borderWidth: 1,
    borderColor:
      `${COLORS.green}30`,
  },

  signedInDot: {
    width: 7,
    height: 7,

    borderRadius: 3.5,

    backgroundColor:
      COLORS.green,
  },

  signedInText: {
    color: COLORS.green,

    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },

  form: {
    width: '100%',
    gap: 12,
  },

  inputWrap: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 17,

    backgroundColor:
      COLORS.surfaceSoft,

    borderWidth: 1,
    borderColor:
      COLORS.borderSoft,

    paddingHorizontal: 10,

    gap: 10,
  },

  inputIconWrap: {
    width: 34,
    height: 34,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.purpleVerySoft,
  },

  input: {
  flex: 1,

  height: 52,

  color: COLORS.textPrimary,

  fontFamily: 'Poppins_400Regular',

  fontSize: 14,
},

  messageError: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 7,

    padding: 11,

    borderRadius: 13,

    backgroundColor:
      COLORS.pinkSoft,
  },

  messageInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 7,

    padding: 11,

    borderRadius: 13,

    backgroundColor:
      COLORS.greenSoft,
  },

  errorText: {
    flex: 1,

    color: COLORS.pink,

    fontFamily:
      'Poppins_400Regular',

    fontSize: 12,
    lineHeight: 18,
  },

  infoText: {
    flex: 1,

    color: COLORS.green,

    fontFamily:
      'Poppins_400Regular',

    fontSize: 12,
    lineHeight: 18,
  },

  submitButton: {
    minHeight: 52,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    backgroundColor:
      COLORS.purple,

    borderRadius: 16,

    marginTop: 4,

    shadowColor:
      COLORS.shadowStrong,

    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 4,
  },

  submitButtonText: {
    color: COLORS.textOnAccent,

    fontFamily:
      'Poppins_600SemiBold',

    fontSize: 14,
  },

  switchModeText: {
    color: COLORS.textSecondary,

    fontFamily:
      'Poppins_400Regular',

    fontSize: 12,

    textAlign: 'center',

    marginTop: 4,
  },

  switchModeLink: {
    color: COLORS.purple,

    fontFamily:
      'Poppins_600SemiBold',
  },

  signOutButton: {
    marginTop: 18,

    minHeight: 46,

    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    borderWidth: 1,
    borderColor:
      `${COLORS.pink}35`,

    borderRadius: 15,

    backgroundColor:
      COLORS.pinkSoft,
  },

  signOutButtonText: {
    color: COLORS.pink,

    fontFamily:
      'Poppins_600SemiBold',

    fontSize: 13,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});