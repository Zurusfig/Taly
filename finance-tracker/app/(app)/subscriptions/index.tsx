import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Repeat } from 'lucide-react-native';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription } from '@/hooks/useSubscriptions';

function cycleLabel(cycle: string): string {
  if (cycle === 'weekly') return 'Weekly';
  if (cycle === 'monthly') return 'Monthly';
  return 'Yearly';
}

function nextDateLabel(dateStr: string): { text: string; urgent: boolean } {
  const d = parseISO(dateStr);
  if (isToday(d)) return { text: 'Due today', urgent: true };
  if (isPast(d)) return { text: 'Overdue', urgent: true };
  return { text: format(d, 'MMM d, yyyy'), urgent: false };
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subs, isLoading } = useSubscriptions();
  const toggle = useUpdateSubscription();
  const remove = useDeleteSubscription();

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete subscription', `Remove "${name}"? This won't delete past transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(id),
      },
    ]);
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscriptions</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/subscriptions/new')} hitSlop={12}>
          <Plus size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {isLoading ? null : !subs?.length ? (
          <View style={styles.empty}>
            <Repeat size={36} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptyBody}>Track recurring charges like Netflix or Spotify. They'll be logged automatically each cycle.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/subscriptions/new')}>
              <Text style={styles.emptyBtnText}>Add subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subs.map((sub) => {
            const { text: dateText, urgent } = nextDateLabel(sub.next_charge_date);
            return (
              <TouchableOpacity
                key={sub.id}
                style={styles.row}
                onPress={() => router.push(`/(app)/subscriptions/${sub.id}`)}
                onLongPress={() => handleDelete(sub.id, sub.name)}
                activeOpacity={0.75}
              >
                {/* Left: icon + info */}
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: sub.category_color ?? colors.bgInput }]}>
                    <Repeat size={14} color={colors.text} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.subName, !sub.active && styles.paused]}>{sub.name}</Text>
                    <Text style={styles.subMeta}>
                      {cycleLabel(sub.cycle)}
                      {sub.wallet_name ? ` · ${sub.wallet_name}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Right: amount + date + toggle */}
                <View style={styles.rowRight}>
                  <Text style={[styles.amount, !sub.active && styles.paused]}>฿{formatAmount(sub.amount)}</Text>
                  <Text style={[styles.nextDate, urgent && styles.urgent]}>{dateText}</Text>
                  <TouchableOpacity
                    style={[styles.badge, sub.active ? styles.badgeActive : styles.badgePaused]}
                    onPress={() => toggle.mutate({ id: sub.id, active: !sub.active })}
                    hitSlop={8}
                  >
                    <Text style={[styles.badgeText, sub.active ? styles.badgeTextActive : styles.badgeTextPaused]}>
                      {sub.active ? 'Active' : 'Paused'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  content: { padding: 16, gap: 10 },

  row: {
    backgroundColor: colors.bgElevated, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 2 },
  subName: { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text },
  subMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  paused: { opacity: 0.45 },

  rowRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  nextDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted },
  urgent: { color: colors.danger },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeActive: { backgroundColor: colors.accentMuted },
  badgePaused: { backgroundColor: colors.bgInput },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  badgeTextActive: { color: colors.accent },
  badgeTextPaused: { color: colors.textDim },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: colors.text },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  emptyBtn: { marginTop: 8, backgroundColor: colors.accent, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  emptyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.bg },
});
