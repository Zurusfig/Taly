import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useBudgets, useDeleteBudget } from '@/hooks/useBudgets';

const PERIOD_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: budgets, isLoading } = useBudgets();
  const deleteBudget = useDeleteBudget();

  function handleDelete(id: string, name: string) {
    Alert.alert(`Delete budget`, `Remove the "${name}" budget?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteBudget.mutateAsync(id); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/budgets/new')} style={styles.back}>
          <Plus size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => {
            const pct = Math.min(((item.spent ?? 0) / item.amount) * 100, 100);
            const over = (item.spent ?? 0) > item.amount;
            const barColor = over ? colors.danger : item.category_color ?? colors.accent;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(app)/budgets/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {item.category_color && (
                      <View style={[styles.dot, { backgroundColor: item.category_color }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.budgetName}>{item.category_name}</Text>
                      <Text style={styles.budgetPeriod}>{PERIOD_LABEL[item.period]}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.category_name ?? 'budget')}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color={colors.textDim} />
                  </TouchableOpacity>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                </View>

                <View style={styles.amounts}>
                  <Text style={[styles.spent, over && { color: colors.danger }]}>
                    ฿{formatAmount(item.spent ?? 0)} spent
                  </Text>
                  <Text style={styles.budget}>of ฿{formatAmount(item.amount)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No budgets yet.</Text>
              <Text style={styles.emptyHint}>Tap + to set a spending limit.</Text>
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
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { padding: 4, width: 40 },
  title: { flex: 1, fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: colors.text, marginLeft: 8 },
  card: { backgroundColor: colors.bgElevated, borderRadius: 14, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  budgetName: { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text },
  budgetPeriod: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textDim, textTransform: 'capitalize' },
  track: { height: 8, backgroundColor: colors.bgInput, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  spent: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text },
  budget: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.textMuted },
  emptyHint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textDim },
});
