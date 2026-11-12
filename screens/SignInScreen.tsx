import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
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

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export function SignInScreen() {
  const navigation = useNavigation<NavProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [authError, setAuthError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const animateIn = () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then(
      (reduced) => {
        if (reduced) {
          opacity.setValue(1);
          translateY.setValue(0);
          return;
        }
        animateIn();
      },
      () => {
        animateIn();
      }
    );
  }, [opacity, translateY]);

  const handleSignIn = async () => {
    setAuthError(undefined);
    let nextEmailErr: string | undefined;
    let nextPassErr: string | undefined;

    if (!email.trim()) {
      nextEmailErr = 'Enter your email.';
    }
    if (!password) {
      nextPassErr = 'Enter your password.';
    }

    setEmailError(nextEmailErr);
    setPasswordError(nextPassErr);
    if (nextEmailErr || nextPassErr || submitting) return;

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setAuthError(result.error ?? 'Could not sign in right now.');
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
          <Animated.View
            style={[
              styles.inner,
              { opacity, transform: [{ translateY }] },
            ]}
          >
            <BrandMark />

            <View style={styles.headingBlock}>
              <Text style={typeScale.heroTitle}>Sign in to LecturerHub</Text>
              <Text style={[typeScale.body, styles.subline]}>
                Manage lecturers, class counts, and course records.
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
                isPassword
                value={password}
                error={passwordError}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(undefined);
                  if (authError) setAuthError(undefined);
                }}
              />
            </View>

            <TasteButton
              label="Sign in"
              loading={submitting}
              onPress={handleSignIn}
            />

            <View style={styles.switchRow}>
              <Text style={typeScale.meta}>No account yet?</Text>
              <Pressable
                hitSlop={10}
                onPress={() => navigation.navigate('SignUp')}
                style={styles.linkHit}
              >
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>
          </Animated.View>
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
