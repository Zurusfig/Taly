import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { addDays, addMonths, addYears, subDays, subMonths, format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription } from '@/hooks/useSubscriptions';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';

type Cycle = 'weekly' | 'monthly' | 'yearly';

const CYCLES: { key: Cycle; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function DatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return (
    <View style={styles.datePicker}>
      <View style={styles.dateArrows}>
        <TouchableOpacity onPress={() => onChange(subMonths(value, 1))} style={styles.arrowBtn} hitSlop={8}>
          <Text style={styles.arrowLabel}>-Mo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange(subDays(value, 1))} style={styles.arrowBtn} hitSlop={8}>
          <ChevronLeft size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.dateText}>{format(value, 'MMM d, yyyy')}</Text>
      <View style={styles.dateArrows}>
        <TouchableOpacity onPress={() => onChange(addDays(value, 1))} style={styles.arrowBtn} hitSlop={8}>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange(addMonths(value, 1))} style={styles.arrowBtn} hitSlop={8}>
          <Text style={styles.arrowLabel}>+Mo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditSubscription() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subs } = useSubscriptions();
  const update = useUpdateSubscription();
  const remove = useDeleteSubscription();
  const { data: wallets } = useWallets();
  const { data: categories } = useCategories();

  const sub = subs?.find((s) => s.id === id);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [nextDate, setNextDate] = useState<Date>(new Date());
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!sub) return;
    setName(sub.name);
    setAmount(String(sub.amount));
    setCycle(sub.cycle);
    setNextDate(parseISO(sub.next_charge_date));
    setWalletId(sub.wallet_id);
    setCategoryId(sub.category_id);
  }, [sub?.id]);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Enter a name'); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Enter a valid amount'); return; }
    if (!walletId) { Alert.alert('Select a wallet'); return; }

    const dateStr = format(nextDate, 'yyyy-MM-dd');
    try {
      await update.mutateAsync({
        id: id!,
        name: name.trim(),
        amount: num,
        cycle,
        wallet_id: walletId,
        category_id: categoryId,
        next_charge_date: dateStr,
        cycle_anchor_date: dateStr,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function handleDelete() {
    Alert.alert('Delete subscription', `Remove "${sub?.name}"? This won't delete past transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  }

  if (!sub) return null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Subscription</Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={12}>
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Active toggle */}
        <TouchableOpacity
          style={[styles.toggleRow, sub.active ? styles.toggleActive : styles.togglePaused]}
          onPress={() => update.mutate({ id: id!, active: !sub.active })}
        >
          <Text style={[styles.toggleText, sub.active ? styles.toggleTextActive : styles.toggleTextPaused]}>
            {sub.active ? 'Active — tap to pause' : 'Paused — tap to resume'}
          </Text>
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textDim}
            autoCapitalize="words"
          />
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textDim}
          />
        </View>

        {/* Cycle */}
        <View style={styles.field}>
          <Text style={styles.label}>Billing cycle</Text>
          <View style={styles.chips}>
            {CYCLES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.chip, cycle === key && styles.chipActive]}
                onPress={() => setCycle(key)}
              >
                <Text style={[styles.chipText, cycle === key && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Next charge date */}
        <View style={styles.field}>
          <Text style={styles.label}>Next charge date</Text>
          <View style={styles.card}>
            <DatePicker value={nextDate} onChange={setNextDate} />
          </View>
        </View>

        {/* Wallet */}
        <View style={styles.field}>
          <Text style={styles.label}>Wallet</Text>
          <View style={styles.chips}>
            {(wallets ?? []).filter(w => !w.archived).map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.chip, walletId === w.id && styles.chipActive]}
                onPress={() => setWalletId(w.id)}
              >
                {w.color && <View style={[styles.dot, { backgroundColor: w.color }]} />}
                <Text style={[styles.chipText, walletId === w.id && styles.chipTextActive]}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.chips}>
            <TouchableOpacity
              style={[styles.chip, categoryId === null && styles.chipActive]}
              onPress={() => setCategoryId(null)}
            >
              <Text style={[styles.chipText, categoryId === null && styles.chipTextActive]}>None</Text>
            </TouchableOpacity>
            {(categories ?? []).filter(c => !c.archived).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, categoryId === c.id && styles.chipActive]}
                onPress={() => setCategoryId(c.id)}
              >
                {c.color && <View style={[styles.dot, { backgroundColor: c.color }]} />}
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, update.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={update.isPending}
        >
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: colors.text },
  content: { padding: 16, gap: 20 },

  toggleRow: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.accentMuted },
  togglePaused: { backgroundColor: colors.bgElevated },
  toggleText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  toggleTextActive: { color: colors.accent },
  toggleTextPaused: { color: colors.textMuted },

  field: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.7 },
  optional: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textDim, textTransform: 'none', letterSpacing: 0 },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: colors.bgElevated, borderRadius: 20,
    borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.accent },
  dot: { width: 8, height: 8, borderRadius: 4 },

  card: { backgroundColor: colors.bgElevated, borderRadius: 12, padding: 16 },
  datePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateArrows: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowBtn: { padding: 4 },
  arrowLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  dateText: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 18, color: colors.text },

  saveBtn: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.bg },
});
