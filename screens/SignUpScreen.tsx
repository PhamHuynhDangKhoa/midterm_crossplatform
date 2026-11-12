import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BrandMark } from '../components/BrandMark';
import { SoftInput } from '../components/SoftInput';
import { TasteButton } from '../components/TasteButton';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigationTypes';
import { palette, radius, space, typeScale } from '../theme/tokens';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export function SignUpScreen() {
  const navigation = useNavigation<NavProp>();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [authError, setAuthError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setAuthError(undefined);
    let nextEmailErr: string | undefined;
    let nextPassErr: string | undefined;
    let nextConfirmErr: string | undefined;

    if (!email.trim()) {
      nextEmailErr = 'Enter your email.';
    }
    if (!password) {
      nextPassErr = 'Enter a password.';
    } else if (password.length < 6) {
      nextPassErr = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      nextConfirmErr = 'Re-enter your password.';
    } else if (password !== confirmPassword) {
      nextConfirmErr = 'Passwords do not match.';
    }

    setEmailError(nextEmailErr);
    setPasswordError(nextPassErr);
    setConfirmError(nextConfirmErr);
    if (nextEmailErr || nextPassErr || nextConfirmErr || submitting) return;

    setSubmitting(true);
    const result = await register(email, password, confirmPassword);
    setSubmitting(false);

    if (!result.success) {
      setAuthError(result.error ?? 'Could not create account right now.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <BrandMark />

            <View style={styles.headingBlock}>
              <Text style={typeScale.heroTitle}>Create admin account</Text>
              <Text style={[typeScale.body, styles.subline]}>
                Register with email to manage QLHocPhan records.
              </Text>
            </View>

            {authError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <SoftInput
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                error={emailError}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(undefined);
                  if (authError) setAuthError(undefined);
                }}
              />

              <SoftInput
                label="Password"
                hint="At least 6 characters."
                isPassword
                value={password}
                error={passwordError}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(undefined);
                  if (authError) setAuthError(undefined);
                }}
              />

              <SoftInput
                label="Confirm password"
                isPassword
                value={confirmPassword}
                error={confirmError}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmError) setConfirmError(undefined);
                }}
              />
            </View>

            <TasteButton
              label="Create account"
              loading={submitting}
              onPress={handleRegister}
            />

            <View style={styles.switchRow}>
              <Text style={typeScale.meta}>Already have an account?</Text>
              <Pressable
                hitSlop={10}
                onPress={() => navigation.goBack()}
                style={styles.linkHit}
              >
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
    paddingVertical: space.xxl,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  inner: {
    gap: space.xl,
  },
  headingBlock: {
    gap: space.sm,
  },
  subline: {
    color: palette.muted,
  },
  errorBanner: {
    backgroundColor: palette.dangerTint,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorBannerText: {
    fontSize: 14,
    color: palette.danger,
  },
  form: {
    gap: space.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  linkHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.accent,
  },
});
