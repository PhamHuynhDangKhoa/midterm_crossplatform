import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { palette, radius, space, typeScale } from '../theme/tokens';
import { LucideIcon } from './LucideIcon';

interface SoftInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

export function SoftInput({
  label,
  error,
  hint,
  isPassword = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: Readonly<SoftInputProps>) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  let borderColor: string = palette.surface;
  if (focused) {
    borderColor = palette.accent;
  }
  if (error) {
    borderColor = palette.danger;
  }

  return (
    <View style={styles.wrap}>
      <Text style={typeScale.label}>{label}</Text>
      <View
        style={[
          styles.fieldShell,
          { borderColor },
          rest.multiline && styles.multilineShell,
        ]}
      >
        <TextInput
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={palette.muted}
          secureTextEntry={isPassword ? hidden : rest.secureTextEntry}
          style={[
            styles.input,
            rest.multiline && styles.multilineInput,
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            style={styles.eyeButton}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <LucideIcon
              name={hidden ? 'eye' : 'eye-off'}
              size={18}
              color={palette.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      {!error && hint ? (
        <Text style={typeScale.meta}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    width: '100%',
  },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: space.lg,
  },
  multilineShell: {
    alignItems: 'flex-start',
    paddingVertical: space.md,
    minHeight: 92,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    fontSize: 16,
    color: palette.ink,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  multilineInput: {
    paddingVertical: 0,
    minHeight: 72,
  },
  eyeButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  error: {
    fontSize: 13,
    color: palette.danger,
  },
});
