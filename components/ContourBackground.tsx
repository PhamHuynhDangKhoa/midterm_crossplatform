import { useId } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { palette } from "../theme/tokens";

const contourImage = require("../assets/contour2.jpg");

// Renders the user's contour asset at low ink opacity with a top calm fade behind the header
export function ContourBackground() {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const calmGradId = `contourImgCalm-${safeId}`;

  return (
    <View style={styles.layer} pointerEvents="none">
      <Image source={contourImage} resizeMode="cover" style={styles.image} />

      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={styles.overlay}
      >
        <Defs>
          <LinearGradient id={calmGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.bg} stopOpacity={0.92} />
            <Stop offset="16%" stopColor={palette.bg} stopOpacity={0.72} />
            <Stop offset="28%" stopColor={palette.bg} stopOpacity={0} />
            <Stop offset="100%" stopColor={palette.bg} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill={`url(#${calmGradId})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: palette.bg,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.11,
    transform: [{ scale: 1.12 }],
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
