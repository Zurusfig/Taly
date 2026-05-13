import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { colors } from '@/theme/colors';
import {
  formatCurrency,
  amountColor,
  amountPrefix,
} from '@/lib/utils';
import { useTransactions, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: txs } = useTransactions();
  const { data: wallets } = useWallets();
  const { data: categories } = useCategories();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const tx = txs?.find((t) => t.id === id);
  const wallet = wallets?.find((w) => w.id === tx?.wallet_id);
  const category = categories?.find((c) => c.id === tx?.category_id);
  const toWallet = wallets?.find((w) => w.id === tx?.to_wallet_id);

  const [note, setNote] = useState(tx?.note ?? '');
  const [editing, setEditing] = useState(false);

  if (!tx) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.notFound}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  async function handleSaveNote() {
    try {
      await updateTx.mutateAsync({ id: tx!.id, note: note || null });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTx.mutateAsync(tx!.id);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  const aColor = amountColor(tx.type);
  const prefix = amountPrefix(tx.type);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount */}
        <View style={styles.amountBlock}>
          <Text style={[styles.amount, { color: aColor }]}>
            {prefix}{formatCurrency(tx.amount, wallet?.currency)}
          </Text>
          <Text style={styles.typeLabel}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <DetailRow label="Date" value={format(new Date(tx.occurred_at), 'MMM d, yyyy · HH:mm')} />
          <View style={styles.sep} />
          <DetailRow label="Wallet" value={wallet?.name ?? '—'} />
          {tx.type !== 'transfer' && (
            <>
              <View style={styles.sep} />
              <DetailRow label="Category" value={category?.name ?? 'Uncategorized'} />
            </>
          )}
          {tx.type === 'transfer' && (
            <>
              <View style={styles.sep} />
              <DetailRow label="To wallet" value={toWallet?.name ?? '—'} />
            </>
          )}
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Note</Text>
          {editing ? (
            <View style={styles.noteEdit}>
              <Input
                value={note}
                onChangeText={setNote}
                placeholder="Add a note…"
                multiline
                autoFocus
              />
              <View style={styles.noteActions}>
                <Button label="Cancel" variant="ghost" onPress={() => { setNote(tx.note ?? ''); setEditing(false); }} style={{ flex: 1 }} />
                <Button label="Save" onPress={handleSaveNote} loading={updateTx.isPending} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.noteTap}>
              <Text style={tx.note ? styles.noteText : styles.notePlaceholder}>
                {tx.note || 'Tap to add note…'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textMuted },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title: {
    flex: 1,
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 20,
    color: colors.text,
    marginLeft: 8,
  },
  deleteBtn: { padding: 4 },
  content: { paddingHorizontal: 16, gap: 16, paddingBottom: 40 },
  amountBlock: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  amount: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 44,
    fontVariant: ['tabular-nums'],
  },
  typeLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textMuted },
  detailValue: { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.text },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  noteSection: { gap: 8 },
  noteLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  noteTap: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 14,
  },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text },
  notePlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textDim },
  noteEdit: { gap: 8 },
  noteActions: { flexDirection: 'row', gap: 8 },
});
