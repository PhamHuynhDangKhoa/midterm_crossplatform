import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type LucideIconName =
  | 'x'
  | 'plus'
  | 'search'
  | 'log-out'
  | 'chevron-down'
  | 'check'
  | 'eye'
  | 'eye-off'
  | 'sliders-horizontal'
  | 'trash-2'
  | 'download'
  | 'arrow-up-down'
  | 'user'
  | 'image';

interface LucideIconProps {
  name: LucideIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Official @iconify-json/lucide glyph coordinates resolved via tasteskill icons.mjs
export function LucideIcon({
  name,
  size = 18,
  color = '#0a0a0a',
  strokeWidth = 1.85,
}: Readonly<LucideIconProps>) {
  const strokeProps = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'x' && (
        <Path d="M18 6L6 18M6 6l12 12" {...strokeProps} />
      )}
      {name === 'plus' && (
        <Path d="M5 12h14m-7-7v14" {...strokeProps} />
      )}
      {name === 'search' && (
        <>
          <Path d="m21 21l-4.34-4.34" {...strokeProps} />
          <Circle cx="11" cy="11" r="8" {...strokeProps} />
        </>
      )}
      {name === 'log-out' && (
        <Path
          d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
          {...strokeProps}
        />
      )}
      {name === 'chevron-down' && (
        <Path d="m6 9l6 6l6-6" {...strokeProps} />
      )}
      {name === 'check' && (
        <Path d="M20 6L9 17l-5-5" {...strokeProps} />
      )}
      {name === 'eye' && (
        <>
          <Path
            d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"
            {...strokeProps}
          />
          <Circle cx="12" cy="12" r="3" {...strokeProps} />
        </>
      )}
      {name === 'eye-off' && (
        <>
          <Path
            d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575a1 1 0 0 1 0 .696a10.8 10.8 0 0 1-1.444 2.49m-6.41-.679a3 3 0 0 1-4.242-4.242"
            {...strokeProps}
          />
          <Path
            d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 4.446-5.143M2 2l20 20"
            {...strokeProps}
          />
        </>
      )}
      {name === 'sliders-horizontal' && (
        <Path
          d="M10 5H3m9 14H3M14 3v4m2 10v4m5-9h-9m9 7h-5m5-14h-7m-6 5v4m0-2H3"
          {...strokeProps}
        />
      )}
      {name === 'trash-2' && (
        <Path
          d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          {...strokeProps}
        />
      )}
      {name === 'download' && (
        <>
          <Path d="M12 15V3m9 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...strokeProps} />
          <Path d="m7 10l5 5l5-5" {...strokeProps} />
        </>
      )}
      {name === 'arrow-up-down' && (
        <Path d="m21 16l-4 4l-4-4m4 4V4M3 8l4-4l4 4M7 4v16" {...strokeProps} />
      )}
      {name === 'user' && (
        <>
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" {...strokeProps} />
          <Circle cx={12} cy={7} r={4} {...strokeProps} />
        </>
      )}
      {name === 'image' && (
        <>
          <Rect width={18} height={18} x={3} y={3} rx={2} ry={2} {...strokeProps} />
          <Circle cx={9} cy={9} r={2} {...strokeProps} />
          <Path d="m21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" {...strokeProps} />
        </>
      )}
    </Svg>
  );
}
