import { useId } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { palette } from "../theme/tokens";

const contourImage = require("../assets/contour1.jpg");

// Renders the user's contour asset inside the ProductForm empty photo stage
// with a soft radial calm zone behind the center label.
export function ContourPattern() {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const calmCenterId = `stageCalm-${safeId}`;

  return (
    <View style={styles.stage} pointerEvents="none">
      <Image source={contourImage} resizeMode="cover" style={styles.image} />

      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={styles.overlay}
      >
        <Defs>
          <RadialGradient id={calmCenterId} cx="50%" cy="50%" r="46%">
            <Stop offset="0%" stopColor={palette.surface} stopOpacity={0.94} />
            <Stop offset="62%" stopColor={palette.surface} stopOpacity={0.68} />
            <Stop offset="100%" stopColor={palette.surface} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill={`url(#${calmCenterId})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: palette.surface,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.14,
    transform: [{ scale: 1.16 }],
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
