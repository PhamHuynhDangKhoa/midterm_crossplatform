import { useEffect, useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { getTypeSwatch, palette, radius } from '../theme/tokens';

interface ProductThumbProps {
  uri?: string;
  name: string;
  type: string;
  aspectRatio?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProductThumb({
  uri,
  name,
  type,
  aspectRatio = 1,
  rounded = true,
  style,
}: Readonly<ProductThumbProps>) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const cleanUri = uri?.trim();
  const baseName = removeParenthesizedText(name).trim();
  const parts = baseName ? baseName.split(/\s+/) : [];
  const givenWord = parts.at(-1) ?? '';
  const initial = (givenWord[0] ?? 'G').toUpperCase();
  const bg = getTypeSwatch(type || name);

  return (
    <View
      style={[
        styles.frame,
        rounded && styles.rounded,
        { aspectRatio, backgroundColor: cleanUri && !failed ? palette.surface : bg },
        style,
      ]}
    >
      {cleanUri && !failed ? (
        <Image
          source={{ uri: cleanUri }}
          style={styles.image}
          onError={() => setFailed(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.monogramWrap}>
          <Text style={styles.initial}>{initial}</Text>
          <View style={styles.accentDots}>
            <View style={[styles.dot, { backgroundColor: palette.bg }]} />
          </View>
        </View>
      )}
    </View>
  );
}

function removeParenthesizedText(value: string): string {
  let depth = 0;
  let result = '';

  for (const character of value) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')' && depth > 0) {
      depth -= 1;
    } else if (depth === 0) {
      result += character;
    }
  }

  return result;
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: radius.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  monogramWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: -1,
    color: palette.ink,
  },
  accentDots: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
});
