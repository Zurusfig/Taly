import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryMasteryMap, masteryLevel, MASTERY_TITLES } from '@/hooks/useCategoryMastery';
import type { CategoryKind } from '@/lib/types';

const TABS: { key: CategoryKind; label: string }[] = [
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const { data: categories, isLoading } = useCategories(kind);
  const { data: masteryMap } = useCategoryMasteryMap();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity onPress={() => router.push(`/(app)/categories/new?kind=${kind}`)} style={styles.back}>
          <Plus size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setKind(key)}
            style={[styles.tab, kind === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, kind === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(app)/categories/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.colorDot, { backgroundColor: item.color ?? colors.accent }]} />
              <Text style={styles.name}>{item.name}</Text>
              {masteryMap?.[item.id] && (
                <Text style={styles.masteryBadge}>
                  Lv.{masteryLevel(masteryMap[item.id].xp)}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {kind} categories.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { padding: 4, width: 40 },
  title: {
    flex: 1,
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    color: colors.text,
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: colors.bgInput },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textMuted },
  tabTextActive: { color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text, flex: 1 },
  masteryBadge: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 13,
    color: colors.textDim,
  },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textMuted },
});
