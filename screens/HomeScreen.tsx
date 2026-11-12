import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BrandMark } from '../components/BrandMark';
import { ContourBackground } from '../components/ContourBackground';
import { LucideIcon } from '../components/LucideIcon';
import { ProductThumb } from '../components/ProductThumb';
import { TasteButton } from '../components/TasteButton';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigationTypes';
import {
  filterAndSortLecturers,
  getNextLecturerId,
  removeLecturer,
  subscribeLecturers,
} from '../services/lecturerService';
import {
  getTypeSwatch,
  palette,
  radius,
  space,
  typeScale,
} from '../theme/tokens';
import { Lecturer, LecturerSortKey } from '../types';
import { confirmAction, showNotice } from '../utils/confirm';
import { exportDatabaseJson } from '../utils/exportDatabase';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

const SORT_CYCLE: LecturerSortKey[] = ['idAsc', 'nameAsc', 'sumDesc'];

const SORT_LABELS: Record<LecturerSortKey, string> = {
  idAsc: 'IDGV',
  nameAsc: 'Name',
  sumDesc: 'Classes ↓',
};

const MAX_SHELL_WIDTH = 1040;
const GRID_GAP = 14;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();

  const shellWidth = Math.min(width, MAX_SHELL_WIDTH);
  let numColumns = 2;
  if (shellWidth >= 900) {
    numColumns = 4;
  } else if (shellWidth >= 620) {
    numColumns = 3;
  }
  const tileWidth = Math.max(
    124,
    Math.floor((shellWidth - space.gutter * 2 - GRID_GAP * (numColumns - 1)) / numColumns)
  );

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<LecturerSortKey>('idAsc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterY = useRef(new Animated.Value(6)).current;
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    setLoadError(null);

    const unsubscribe = subscribeLecturers(
      (list) => {
        setLecturers(list);
        setLoading(false);
      },
      (message) => {
        setLoadError(message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;
    const animateIn = () => {
      Animated.parallel([
        Animated.timing(enterOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(enterY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then(
      (reduced) => {
        if (reduced) {
          enterOpacity.setValue(1);
          enterY.setValue(0);
          return;
        }
        animateIn();
      },
      () => {
        animateIn();
      }
    );
  }, [loading, enterOpacity, enterY]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const visibleLecturers = useMemo(
    () => filterAndSortLecturers(lecturers, searchText, sortBy),
    [lecturers, searchText, sortBy]
  );
  const hasNoLecturers = lecturers.length === 0;
  const hasNoMatches = !hasNoLecturers && visibleLecturers.length === 0;

  const suggestedNextId = useMemo(
    () => getNextLecturerId(lecturers),
    [lecturers]
  );

  const handleCycleSort = () => {
    const currentIndex = SORT_CYCLE.indexOf(sortBy);
    setSortBy(SORT_CYCLE[(currentIndex + 1) % SORT_CYCLE.length]);
  };

  const handleExport = async () => {
    try {
      const mode = await exportDatabaseJson(lecturers);
      if (mode === 'downloaded') {
        setExportNotice('JSON saved');
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => setExportNotice(null), 2600);
      }
    } catch (err) {
      showNotice(
        'Export failed',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  };

  const handleLogout = () => {
    confirmAction(
      'Sign out',
      'End the current admin session?',
      'Sign out',
      async () => {
        const res = await logout();
        if (!res.success) {
          showNotice('Could not sign out', res.error ?? 'Please try again.');
        }
      }
    );
  };

  const handleDelete = (item: Lecturer) => {
    if (!user?.uid) return;
    confirmAction(
      `Delete ${item.Fullname}?`,
      `Record ${item.IDGV} will be removed from QLHocPhan.`,
      'Delete lecturer',
      async () => {
        setDeletingId(item.IDGV);
        try {
          await removeLecturer(item.IDGV);
        } catch (err) {
          showNotice(
            'Could not delete',
            err instanceof Error ? err.message : 'Please try again.'
          );
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const openAdd = () => {
    navigation.navigate('LecturerForm', { suggestedId: suggestedNextId });
  };

  const openEdit = (item: Lecturer) => {
    navigation.navigate('LecturerForm', { lecturer: item });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={[typeScale.meta, styles.centerNote]}>
            Loading QLHocPhan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ContourBackground />
      <View style={styles.shell}>
        <Animated.View
          style={[
            styles.flex,
            { opacity: enterOpacity, transform: [{ translateY: enterY }] },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.brandWrap}>
              <BrandMark size="sm" />
            </View>
            <Pressable
              onPress={handleLogout}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && styles.pressedSoft,
              ]}
            >
              <LucideIcon name="log-out" size={14} color={palette.ink} />
              <Text style={styles.logoutText} numberOfLines={1}>
                Sign out
              </Text>
            </Pressable>
          </View>

          <View style={styles.adminBar}>
            <View style={styles.adminIdentity}>
              <LucideIcon name="user" size={13} color={palette.muted} />
              <Text
                style={styles.adminEmail}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {user?.email ?? 'Admin'}
              </Text>
            </View>
          </View>

          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : null}

          {lecturers.length > 0 ? (
            <View style={styles.controlsWrap}>
              <View style={styles.searchSlot}>
                <View style={styles.searchBox}>
                  <LucideIcon name="search" size={16} color={palette.muted} />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search ID or name..."
                    placeholderTextColor={palette.muted}
                    style={styles.searchInput}
                    returnKeyType="search"
                    accessibilityLabel="Search lecturers by ID or name"
                  />
                  {searchText.length > 0 ? (
                    <Pressable
                      onPress={() => setSearchText('')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                      style={styles.clearBtn}
                    >
                      <LucideIcon name="x" size={15} color={palette.muted} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionStrip}>
                <Pressable
                  onPress={handleCycleSort}
                  accessibilityRole="button"
                  accessibilityLabel={`Change sort order, current ${SORT_LABELS[sortBy]}`}
                  style={({ pressed }) => [
                    styles.actionChip,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <LucideIcon
                    name="arrow-up-down"
                    size={14}
                    color={palette.ink}
                  />
                  <Text style={styles.actionChipText} numberOfLines={1}>
                    Sort: {SORT_LABELS[sortBy]}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleExport}
                  accessibilityRole="button"
                  accessibilityLabel="Export GiangVien.json"
                  style={({ pressed }) => [
                    styles.actionChip,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <LucideIcon name="download" size={14} color={palette.ink} />
                  <Text style={styles.actionChipText} numberOfLines={1}>
                    {exportNotice ?? 'Export JSON'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {hasNoLecturers ? (
            <View style={styles.emptyCenter}>
              <Text style={typeScale.title}>No lecturers yet</Text>
              <Text style={[typeScale.body, styles.emptyDesc]}>
                Add a lecturer to assign an IDGV, store a photo, and track class counts.
              </Text>
              <View style={styles.emptyAction}>
                <TasteButton label="Add lecturer" onPress={openAdd} />
              </View>
            </View>
          ) : null}

          {hasNoMatches ? (
            <View style={styles.emptyCenter}>
              <Text style={typeScale.title}>No matches</Text>
              <Text style={[typeScale.body, styles.emptyDesc]}>
                No lecturers match “{searchText.trim()}”.
              </Text>
              <Pressable
                onPress={() => setSearchText('')}
                style={({ pressed }) => [
                  styles.resetFilterHit,
                  pressed && styles.pressedSoft,
                ]}
              >
                <Text style={styles.resetFilterText}>Clear search</Text>
              </Pressable>
            </View>
          ) : null}

          {!hasNoLecturers && !hasNoMatches ? (
            <FlatList
              key={`grid-${numColumns}`}
              data={visibleLecturers}
              keyExtractor={(item) => item.IDGV}
              numColumns={numColumns}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const swatch = getTypeSwatch(item.IDGV);
                const isBusy = deletingId === item.IDGV;

                return (
                  <View style={[styles.gridCard, { width: tileWidth }]}>
                    <Pressable
                      onPress={() => openEdit(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit lecturer ${item.Fullname}`}
                      style={({ pressed }) => [
                        styles.tileTap,
                        pressed && styles.tilePressed,
                      ]}
                    >
                      <ProductThumb
                        uri={item.Image}
                        name={item.Fullname}
                        type={item.IDGV}
                        aspectRatio={1.25}
                        rounded
                      />
                      <Text style={styles.tileName} numberOfLines={1}>
                        {item.Fullname}
                      </Text>
                    </Pressable>

                    <View style={styles.metaBottomRow}>
                      <Pressable
                        onPress={() => openEdit(item)}
                        style={({ pressed }) => [
                          styles.metaLeftCol,
                          pressed && styles.tilePressed,
                        ]}
                      >
                        <View style={styles.typeMetaRow}>
                          <View
                            style={[styles.smallDot, { backgroundColor: swatch }]}
                          />
                          <Text style={typeScale.meta} numberOfLines={1}>
                            {item.IDGV}
                          </Text>
                        </View>
                        <Text style={styles.sumClassText} numberOfLines={1}>
                          {item.SumClass} {item.SumClass === 1 ? 'class' : 'classes'}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDelete(item)}
                        disabled={isBusy}
                        hitSlop={4}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete lecturer ${item.Fullname}`}
                        style={({ pressed }) => [
                          styles.deleteBtn,
                          pressed && styles.pressedSoft,
                        ]}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color={palette.danger} />
                        ) : (
                          <LucideIcon
                            name="trash-2"
                            size={16}
                            color={palette.muted}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              }}
            />
          ) : null}
        </Animated.View>

        {lecturers.length > 0 ? (
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            accessibilityLabel="Add lecturer"
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <LucideIcon name="plus" size={24} color={palette.bg} />
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_SHELL_WIDTH,
    alignSelf: 'center',
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  centerNote: {
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: space.sm,
  },
  brandWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: 6,
    paddingLeft: space.md,
    paddingRight: 0,
    minHeight: 44,
    minWidth: 44,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.ink,
  },
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.gutter,
    paddingBottom: space.md,
  },
  adminIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  adminEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.muted,
    flexShrink: 1,
  },
  controlsWrap: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.md,
    gap: space.sm,
  },
  searchSlot: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 48,
    gap: space.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: palette.ink,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  clearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
    paddingHorizontal: space.md,
    minHeight: 44,
    borderRadius: radius.pill,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.ink,
    flexShrink: 1,
  },
  errorBox: {
    marginHorizontal: space.gutter,
    marginBottom: space.sm,
    backgroundColor: palette.dangerTint,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xs,
    paddingBottom: 96,
    gap: space.xl,
  },
  gridRow: {
    gap: GRID_GAP,
    alignItems: 'flex-start',
  },
  gridCard: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(248, 248, 248, 0.80)',
    borderRadius: radius.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2dd',
  },
  tileTap: {
    gap: 6,
    width: '100%',
  },
  tilePressed: {
    opacity: 0.72,
  },
  tileName: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    color: palette.ink,
    width: '100%',
    paddingHorizontal: 6,
  },
  metaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 6,
    width: '100%',
  },
  metaLeftCol: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    justifyContent: 'center',
    gap: 3,
  },
  typeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  sumClassText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
    width: '100%',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
    gap: space.md,
  },
  emptyDesc: {
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyAction: {
    width: '100%',
    maxWidth: 240,
    marginTop: space.sm,
  },
  resetFilterHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.ink,
  },
  pressedSoft: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: space.gutter,
    bottom: space.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
