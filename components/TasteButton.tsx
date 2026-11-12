import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { palette, radius, space } from "../theme/tokens";
import { LucideIcon, LucideIconName } from "./LucideIcon";

type Variant = "primary" | "tonal" | "dangerText";

interface TasteButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TasteButton({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
}: Readonly<TasteButtonProps>) {
  const scale = useRef(new Animated.Value(1)).current;

  const stepTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: 90,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  let textColor: string = palette.ink;
  if (variant === "primary") {
    textColor = palette.accentInk;
  } else if (variant === "dangerText") {
    textColor = palette.danger;
  }

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => stepTo(0.985)}
        onPressOut={() => stepTo(1)}
        style={({ pressed }) => [
          styles.base,
          compact ? styles.compact : styles.regular,
          isPrimary(variant) && styles.primary,
          variant === "tonal" && styles.tonal,
          variant === "dangerText" && styles.dangerText,
          (disabled || loading) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon ? (
              <LucideIcon name={icon} size={16} color={textColor} />
            ) : null}
            <Text
              style={[styles.label, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function isPrimary(variant: Variant) {
  return variant === "primary";
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "100%",
  },
  base: {
    minHeight: 44,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  regular: {
    height: 48,
    paddingHorizontal: space.xl,
  },
  compact: {
    height: 44,
    paddingHorizontal: space.lg,
  },
  primary: {
    backgroundColor: palette.accent,
  },
  tonal: {
    backgroundColor: palette.surface,
  },
  dangerText: {
    backgroundColor: palette.dangerTint,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
  },
});
