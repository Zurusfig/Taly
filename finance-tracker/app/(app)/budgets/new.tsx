import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';

const PERIODS = [
  { key: 'weekly' as const, label: 'Weekly' },
  { key: 'monthly' as const, label: 'Monthly' },
  { key: 'yearly' as const, label: 'Yearly' },
];

export default function NewBudget() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createBudget = useCreateBudget();
  const { data: categories } = useCategories();

  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Enter a valid amount'); return; }
    try {
      await createBudget.mutateAsync({ category_id: categoryId, period, amount: num });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Budget</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Budget amount (฿)"
          placeholder="0.00"
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
          <Text style={styles.fieldLabel}>Category (optional — leave blank for total spending)</Text>
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

        <Button
          label="Create budget"
          onPress={handleSave}
          loading={createBudget.isPending}
          disabled={!amount}
          style={styles.saveBtn}
        />
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
  saveBtn: { marginTop: 8 },
});
