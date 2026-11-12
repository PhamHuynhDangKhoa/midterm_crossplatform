import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/tokens';

interface BrandMarkProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export function BrandMark({
  size = 'md',
  showWordmark = true,
}: Readonly<BrandMarkProps>) {
  const circleSize = size === 'sm' ? 18 : 24;

  return (
    <View style={styles.row}>
      <View style={styles.circles}>
        <View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: palette.mint,
            },
          ]}
        />
        <View
          style={[
            styles.circle,
            styles.secondCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: palette.pink,
              marginLeft: -Math.round(circleSize * 0.35),
            },
          ]}
        />
      </View>
      {showWordmark ? (
        <Text style={[styles.wordmark, size === 'sm' && styles.wordmarkSm]}>
          LecturerHub
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    borderWidth: 1,
    borderColor: palette.bg,
  },
  secondCircle: {
    opacity: 0.94,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: palette.ink,
  },
  wordmarkSm: {
    fontSize: 16,
  },
});
