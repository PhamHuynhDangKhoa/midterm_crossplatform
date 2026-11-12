import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { palette, radius, space, typeScale } from '../theme/tokens';
import { LucideIcon } from './LucideIcon';
import { TasteButton } from './TasteButton';

interface WebImageCropModalProps {
  visible: boolean;
  uri: string | null;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
  onError?: (message: string) => void;
}

const ASPECT_RATIO = 5 / 4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const OUTPUT_WIDTH = 480;
const OUTPUT_HEIGHT = 384;
const MAX_OUTPUT_CHARS = 280000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function encodeCroppedCanvas(
  sourceUri: string,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      reject(new Error('Image cropping is only available in browser sessions.'));
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not initialize image canvas.'));
        return;
      }

      const natW = img.naturalWidth || img.width || OUTPUT_WIDTH;
      const natH = img.naturalHeight || img.height || OUTPUT_HEIGHT;
      const safeX = clamp(sx, 0, Math.max(0, natW - 1));
      const safeY = clamp(sy, 0, Math.max(0, natH - 1));
      const safeW = clamp(sw, 1, natW - safeX);
      const safeH = clamp(sh, 1, natH - safeY);

      ctx.drawImage(
        img,
        safeX,
        safeY,
        safeW,
        safeH,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      for (const quality of [0.82, 0.7, 0.56]) {
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length <= MAX_OUTPUT_CHARS || quality === 0.56) {
          resolve(result);
          return;
        }
      }
    };
    img.onerror = () => reject(new Error('Could not read the selected image.'));
    img.src = sourceUri;
  });
}

export function WebImageCropModal({
  visible,
  uri,
  onCancel,
  onConfirm,
  onError,
}: Readonly<WebImageCropModalProps>) {
  const { width: windowWidth } = useWindowDimensions();
  const frameWidth = Math.min(360, Math.max(240, windowWidth - 72));
  const frameHeight = Math.round(frameWidth / ASPECT_RATIO);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(180);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const zoomStartRef = useRef(MIN_ZOOM);
  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);
  onCancelRef.current = onCancel;
  onErrorRef.current = onError;

  const stateRef = useRef({
    offsetX: 0,
    offsetY: 0,
    maxPanX: 0,
    maxPanY: 0,
    zoom: MIN_ZOOM,
    trackWidth: 180,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || !uri || typeof window === 'undefined') {
      return;
    }

    let active = true;
    setNaturalSize(null);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });

    const probe = new window.Image();
    probe.onload = () => {
      if (!active) return;
      const w = probe.naturalWidth || probe.width;
      const h = probe.naturalHeight || probe.height;
      if (w > 0 && h > 0) {
        setNaturalSize({ width: w, height: h });
      } else {
        onErrorRef.current?.('Invalid image dimensions.');
        onCancelRef.current();
      }
    };
    probe.onerror = () => {
      if (!active) return;
      onErrorRef.current?.('Could not load the selected image.');
      onCancelRef.current();
    };
    probe.src = uri;

    return () => {
      active = false;
    };
  }, [visible, uri]);

  const metrics = useMemo(() => {
    if (!naturalSize) {
      return {
        scale: 1,
        dispW: frameWidth,
        dispH: frameHeight,
        maxPanX: 0,
        maxPanY: 0,
      };
    }
    const baseScale = Math.max(
      frameWidth / naturalSize.width,
      frameHeight / naturalSize.height
    );
    const scale = baseScale * zoom;
    const dispW = naturalSize.width * scale;
    const dispH = naturalSize.height * scale;
    return {
      scale,
      dispW,
      dispH,
      maxPanX: Math.max(0, (dispW - frameWidth) / 2),
      maxPanY: Math.max(0, (dispH - frameHeight) / 2),
    };
  }, [naturalSize, frameWidth, frameHeight, zoom]);

  stateRef.current = {
    offsetX: offset.x,
    offsetY: offset.y,
    maxPanX: metrics.maxPanX,
    maxPanY: metrics.maxPanY,
    zoom,
    trackWidth,
  };

  const applyZoom = useCallback(
    (nextZoomRaw: number) => {
      const nextZoom = clamp(Math.round(nextZoomRaw * 100) / 100, MIN_ZOOM, MAX_ZOOM);
      setZoom(nextZoom);
      if (naturalSize) {
        const baseScale = Math.max(
          frameWidth / naturalSize.width,
          frameHeight / naturalSize.height
        );
        const scale = baseScale * nextZoom;
        const maxX = Math.max(0, (naturalSize.width * scale - frameWidth) / 2);
        const maxY = Math.max(0, (naturalSize.height * scale - frameHeight) / 2);
        setOffset((prev) => ({
          x: clamp(prev.x, -maxX, maxX),
          y: clamp(prev.y, -maxY, maxY),
        }));
      }
    },
    [naturalSize, frameWidth, frameHeight]
  );

  const stageResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = {
            x: stateRef.current.offsetX,
            y: stateRef.current.offsetY,
          };
          setDragging(true);
        },
        onPanResponderMove: (_evt, gesture) => {
          const { maxPanX, maxPanY } = stateRef.current;
          setOffset({
            x: clamp(dragStartRef.current.x + gesture.dx, -maxPanX, maxPanX),
            y: clamp(dragStartRef.current.y + gesture.dy, -maxPanY, maxPanY),
          });
        },
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    []
  );

  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const widthPx = Math.max(1, stateRef.current.trackWidth);
          const ratio = clamp(evt.nativeEvent.locationX / widthPx, 0, 1);
          const nextZoom = MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM);
          zoomStartRef.current = nextZoom;
          applyZoom(nextZoom);
        },
        onPanResponderMove: (_evt, gesture) => {
          const widthPx = Math.max(1, stateRef.current.trackWidth);
          const deltaZoom = (gesture.dx / widthPx) * (MAX_ZOOM - MIN_ZOOM);
          applyZoom(zoomStartRef.current + deltaZoom);
        },
      }),
    [applyZoom]
  );

  const handleApply = async () => {
    if (!uri || !naturalSize || processing) return;
    setProcessing(true);
    try {
      const { scale, dispW, dispH } = metrics;
      const cropLeftPx = (dispW - frameWidth) / 2 - offset.x;
      const cropTopPx = (dispH - frameHeight) / 2 - offset.y;
      const dataUrl = await encodeCroppedCanvas(
        uri,
        cropLeftPx / scale,
        cropTopPx / scale,
        frameWidth / scale,
        frameHeight / scale
      );
      onConfirm(dataUrl);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not trim photo.');
    } finally {
      setProcessing(false);
    }
  };

  if (Platform.OS !== 'web' || !visible || !uri) {
    return null;
  }

  const zoomProgress = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const canReset = zoom !== MIN_ZOOM || offset.x !== 0 || offset.y !== 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={typeScale.title}>Trim photo</Text>
            <Pressable
              onPress={onCancel}
              disabled={processing}
              accessibilityRole="button"
              accessibilityLabel="Close photo trimmer"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressedSoft,
              ]}
            >
              <LucideIcon name="x" size={18} color={palette.ink} />
            </Pressable>
          </View>

          <View
            {...stageResponder.panHandlers}
            style={[
              styles.cropFrame,
              {
                width: frameWidth,
                height: frameHeight,
                ...(Platform.OS === 'web'
                  ? ({ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' } as any)
                  : {}),
              },
            ]}
          >
            {naturalSize ? (
              <View style={styles.imageLayer} pointerEvents="none">
                <Image
                  source={{ uri }}
                  resizeMode="stretch"
                  style={{
                    position: 'absolute',
                    width: metrics.dispW,
                    height: metrics.dispH,
                    left: (frameWidth - metrics.dispW) / 2 + offset.x,
                    top: (frameHeight - metrics.dispH) / 2 + offset.y,
                  }}
                />
              </View>
            ) : (
              <View style={styles.loaderBox} pointerEvents="none">
                <ActivityIndicator size="small" color={palette.bg} />
              </View>
            )}

            <View style={styles.gridOverlay} pointerEvents="none">
              <View style={[styles.guideV, { left: '33.33%' }]} />
              <View style={[styles.guideV, { left: '66.66%' }]} />
              <View style={[styles.guideH, { top: '33.33%' }]} />
              <View style={[styles.guideH, { top: '66.66%' }]} />
            </View>
          </View>

          <View style={styles.controlsBlock}>
            <View style={styles.zoomRow}>
              <Pressable
                onPress={() => applyZoom(zoom - ZOOM_STEP)}
                disabled={zoom <= MIN_ZOOM || processing}
                accessibilityRole="button"
                accessibilityLabel="Zoom out"
                style={({ pressed }) => [
                  styles.stepBtn,
                  zoom <= MIN_ZOOM && styles.stepDisabled,
                  pressed && styles.pressedSoft,
                ]}
              >
                <LucideIcon name="minus" size={16} color={palette.ink} />
              </Pressable>

              <View
                {...sliderResponder.panHandlers}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                accessibilityRole="adjustable"
                accessibilityLabel="Zoom level"
                style={styles.sliderHit}
              >
                <View style={styles.sliderTrack} pointerEvents="none">
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${Math.round(zoomProgress * 100)}%` },
                    ]}
                  />
                </View>
                <View
                  pointerEvents="none"
                  style={[
                    styles.sliderThumb,
                    { left: clamp(zoomProgress * trackWidth - 9, 0, Math.max(0, trackWidth - 18)) },
                  ]}
                />
              </View>

              <Pressable
                onPress={() => applyZoom(zoom + ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM || processing}
                accessibilityRole="button"
                accessibilityLabel="Zoom in"
                style={({ pressed }) => [
                  styles.stepBtn,
                  zoom >= MAX_ZOOM && styles.stepDisabled,
                  pressed && styles.pressedSoft,
                ]}
              >
                <LucideIcon name="plus" size={16} color={palette.ink} />
              </Pressable>

              <Text style={[typeScale.meta, typeScale.number, styles.zoomValue]}>
                {zoom.toFixed(1)}×
              </Text>
            </View>

            <View style={styles.actionRow}>
              {canReset ? (
                <Pressable
                  onPress={() => {
                    setZoom(MIN_ZOOM);
                    setOffset({ x: 0, y: 0 });
                  }}
                  disabled={processing}
                  accessibilityRole="button"
                  accessibilityLabel="Reset crop"
                  style={({ pressed }) => [
                    styles.resetBtn,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              ) : (
                <TasteButton
                  label="Cancel"
                  variant="tonal"
                  compact
                  disabled={processing}
                  onPress={onCancel}
                />
              )}

              <TasteButton
                label="Apply crop"
                loading={processing}
                disabled={!naturalSize}
                onPress={handleApply}
                style={styles.applyBtn}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.gutter,
  },
  card: {
    width: '100%',
    maxWidth: 408,
    backgroundColor: palette.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropFrame: {
    alignSelf: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.ink,
    overflow: 'hidden',
    position: 'relative',
  },
  imageLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: radius.md,
  },
  guideV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  guideH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  controlsBlock: {
    gap: space.lg,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepDisabled: {
    opacity: 0.4,
  },
  sliderHit: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.accent,
    borderWidth: 2,
    borderColor: palette.bg,
  },
  zoomValue: {
    minWidth: 34,
    textAlign: 'right',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  resetBtn: {
    minHeight: 44,
    minWidth: 68,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink,
  },
  applyBtn: {
    flex: 1,
  },
  pressedSoft: {
    opacity: 0.65,
  },
});
