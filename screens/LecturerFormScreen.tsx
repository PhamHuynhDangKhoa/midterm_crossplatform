import { useLayoutEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContourPattern } from '../components/ContourPattern';
import { SoftInput } from '../components/SoftInput';
import { TasteButton } from '../components/TasteButton';
import { AppStackParamList } from '../navigationTypes';
import { addLecturerAuto, editLecturer } from '../services/lecturerService';
import { palette, radius, space, typeScale } from '../theme/tokens';
import { showNotice } from '../utils/confirm';

type FormRoute = RouteProp<AppStackParamList, 'LecturerForm'>;
type NavProp = NativeStackNavigationProp<AppStackParamList, 'LecturerForm'>;

const MAX_IMAGE_CHARS = 290000;

function CropCornerGlyph() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Path
        d="M5 10V6.5C5 5.67 5.67 5 6.5 5H10M18 5H21.5C22.33 5 23 5.67 23 6.5V10M23 18V21.5C23 22.33 22.33 23 21.5 23H18M10 23H6.5C5.67 23 5 22.33 5 21.5V18"
        fill="none"
        stroke={palette.ink}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M14 10.5V17.5M10.5 14H17.5"
        fill="none"
        stroke={palette.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Shrinks Web canvas/file data URLs so images stay fast and within Firestore limits. */
async function compressWebImageDataUrl(uri: string): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || !uri.startsWith('data:image')) {
    return uri;
  }

  return new Promise((resolve) => {
    const ImgConstructor = typeof window !== 'undefined' ? window.Image : undefined;
    if (!ImgConstructor) {
      resolve(uri);
      return;
    }

    const img = new ImgConstructor();
    img.onload = () => {
      const maxEdge = 480;
      const scale = Math.min(1, maxEdge / Math.max(img.width || maxEdge, img.height || maxEdge));
      const width = Math.max(1, Math.round((img.width || maxEdge) * scale));
      const height = Math.max(1, Math.round((img.height || maxEdge) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(uri);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compact = canvas.toDataURL('image/jpeg', 0.72);
      resolve(compact.length < uri.length ? compact : uri);
    };
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}

export function LecturerFormScreen() {
  const route = useRoute<FormRoute>();
  const navigation = useNavigation<NavProp>();

  const existing = route.params?.lecturer;
  const isEdit = Boolean(existing);
  const assignedId = existing?.IDGV ?? route.params?.suggestedId ?? 'GV001';

  const [fullname, setFullname] = useState(existing?.Fullname ?? '');
  const [sumClassText, setSumClassText] = useState(
    existing !== undefined ? String(existing.SumClass) : ''
  );
  const [imageUri, setImageUri] = useState(existing?.Image ?? '');
  const [showUrlField, setShowUrlField] = useState(
    Boolean(existing?.Image?.startsWith('http'))
  );

  const [fullnameErr, setFullnameErr] = useState<string | undefined>();
  const [sumClassErr, setSumClassErr] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit lecturer' : 'Add lecturer',
    });
  }, [isEdit, navigation]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showNotice(
        'Photo access needed',
        'Allow photo library access in device settings to select an image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [5, 4],
      quality: 0.35,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    let nextUri = asset.uri;

    if (Platform.OS === 'web') {
      nextUri = await compressWebImageDataUrl(asset.uri);
    } else if (asset.base64) {
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      if (dataUrl.length <= MAX_IMAGE_CHARS) {
        nextUri = dataUrl;
      }
    }

    if (nextUri.length > MAX_IMAGE_CHARS) {
      showNotice(
        'Image too large',
        'Choose a lighter image or paste an image URL instead.'
      );
      return;
    }

    setImageUri(nextUri);
  };

  const handleSave = async () => {
    const cleanName = fullname.trim();
    const cleanSumText = sumClassText.trim();
    const cleanImg = imageUri.trim();

    let nextNameErr: string | undefined;
    let nextSumErr: string | undefined;

    if (!cleanName) {
      nextNameErr = 'Enter the lecturer full name.';
    } else if (cleanName.length > 100) {
      nextNameErr = 'Full name cannot exceed 100 characters.';
    }

    const parsedSum = /^\d+$/.test(cleanSumText)
      ? Number(cleanSumText)
      : Number.NaN;
    if (!Number.isInteger(parsedSum) || parsedSum < 0 || parsedSum > 1000) {
      nextSumErr = 'Total classes must be a whole number from 0 to 1000.';
    }

    setFullnameErr(nextNameErr);
    setSumClassErr(nextSumErr);

    if (nextNameErr || nextSumErr) {
      return;
    }

    setSaving(true);
    try {
      if (isEdit && existing) {
        await editLecturer(existing.IDGV, {
          IDGV: existing.IDGV,
          Fullname: cleanName,
          Image: cleanImg,
          SumClass: parsedSum,
        });
      } else {
        await addLecturerAuto({
          Fullname: cleanName,
          Image: cleanImg,
          SumClass: parsedSum,
        });
      }
      navigation.goBack();
    } catch (err) {
      showNotice(
        'Save failed',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasPhoto = imageUri.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoBlock}>
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel={
              hasPhoto ? 'Change lecturer photo' : 'Select lecturer photo'
            }
            style={({ pressed }) => [
              styles.heroStage,
              pressed && styles.stagePressed,
            ]}
          >
            {hasPhoto ? (
              <Image
                source={{ uri: imageUri.trim() }}
                style={styles.heroPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroEmpty}>
                <ContourPattern />
                <View style={styles.centerBadge}>
                  <CropCornerGlyph />
                  <Text style={styles.heroEmptyLabel} numberOfLines={1}>
                    Select photo
                  </Text>
                  <Text style={typeScale.meta} numberOfLines={1}>
                    Optional · 5:4 ratio
                  </Text>
                </View>
              </View>
            )}
          </Pressable>

          <View style={styles.photoActions}>
            <Pressable
              onPress={() => setShowUrlField((prev) => !prev)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.photoActionHit,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.urlToggleText}>
                {showUrlField ? 'Hide URL field' : 'Paste image URL'}
              </Text>
            </Pressable>

            {hasPhoto ? (
              <Pressable
                onPress={() => setImageUri('')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.photoActionHit,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {showUrlField ? (
          <SoftInput
            label="Image URL"
            placeholder="https://..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={imageUri}
            onChangeText={setImageUri}
          />
        ) : null}

        <View style={styles.fields}>
          <View style={styles.idRow}>
            <Text style={typeScale.label}>Lecturer ID (IDGV)</Text>
            <Text style={styles.idValue}>
              {assignedId}
              {!isEdit ? <Text style={typeScale.meta}> · Auto-assigned</Text> : null}
            </Text>
          </View>

          <SoftInput
            label="Full name (Fullname)"
            autoCapitalize="words"
            maxLength={100}
            value={fullname}
            onChangeText={(text) => {
              setFullname(text);
              if (fullnameErr) setFullnameErr(undefined);
            }}
            error={fullnameErr}
          />

          <SoftInput
            label="Total classes (SumClass)"
            placeholder="Whole number, 0 or more"
            keyboardType="number-pad"
            maxLength={4}
            value={sumClassText}
            onChangeText={(text) => {
              setSumClassText(text);
              if (sumClassErr) setSumClassErr(undefined);
            }}
            error={sumClassErr}
          />
        </View>

        <TasteButton
          label={isEdit ? 'Save changes' : 'Add lecturer'}
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    gap: space.xl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  photoBlock: {
    gap: space.xs,
  },
  heroStage: {
    width: '100%',
    height: 248,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  stagePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  heroEmptyLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink,
    marginTop: 2,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoActionHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  actionPressed: {
    opacity: 0.65,
  },
  urlToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.muted,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.danger,
  },
  fields: {
    gap: space.lg,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2dd',
  },
  idValue: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
  },
});
