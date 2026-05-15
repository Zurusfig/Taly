import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBudgets, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';

const PERIODS = [
  { key: 'weekly' as const, label: 'Weekly' },
  { key: 'monthly' as const, label: 'Monthly' },
  { key: 'yearly' as const, label: 'Yearly' },
];

export default function EditBudget() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: budgets } = useBudgets();
  const { data: categories } = useCategories();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const budget = budgets?.find((b) => b.id === id);

  const [amount, setAmount] = useState(budget?.amount.toString() ?? '');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(budget?.period ?? 'monthly');
  const [categoryId, setCategoryId] = useState<string | null>(budget?.category_id ?? null);

  useEffect(() => {
    if (budget) {
      setAmount(budget.amount.toString());
      setPeriod(budget.period);
      setCategoryId(budget.category_id);
    }
  }, [budget?.id]);

  if (!budget) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Enter a valid amount'); return; }
    try {
      await updateBudget.mutateAsync({ id: budget!.id, category_id: categoryId, period, amount: num });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete budget', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteBudget.mutateAsync(budget!.id); router.back(); }
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
        <Text style={styles.title}>Edit Budget</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Budget amount (฿)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Period</Text>
          <View style={styles.chips}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.chip, period === p.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, period === p.key && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.catList}>
            <TouchableOpacity
              onPress={() => setCategoryId(null)}
              style={[styles.catChip, categoryId === null && styles.catChipActive]}
            >
              <Text style={[styles.chipText, categoryId === null && styles.chipTextActive]}>All spending</Text>
            </TouchableOpacity>
            {(categories ?? []).map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
              >
                <View style={[styles.catDot, { backgroundColor: c.color ?? colors.accent }]} />
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button label="Save changes" onPress={handleSave} loading={updateBudget.isPending} disabled={!amount} />
        <Button label="Delete budget" variant="danger" onPress={handleDelete} loading={deleteBudget.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { padding: 4, width: 40 },
  title: { flex: 1, fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: colors.text, marginLeft: 8 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 100, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted },
  chipTextActive: { color: colors.text },
  catList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  catChipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  catDot: { width: 8, height: 8, borderRadius: 4 },
});
