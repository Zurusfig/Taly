import { useState, useCallback, Fragment } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  LogBox,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { currencySymbol, formatAmount } from '@/lib/utils';
import { NumPad, useNumPadAmount } from '@/components/ui/NumPad';
import { Button } from '@/components/ui/Button';
import { PillButton } from '@/components/ui/PillButton';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useQuickLogStore } from '@/stores/quickLog';
import type { TransactionType } from '@/lib/types';

// Expo Go fires this from modal view controllers — harmless, suppress in dev
LogBox.ignoreLogs(['No native splash screen registered']);

const TYPE_COLORS: Record<TransactionType, string> = {
  expense: colors.danger,   // red
  income: '#4CAF50',        // green
  transfer: colors.warning, // yellow
};

// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal<T extends { id: string; name: string; color?: string | null }>({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pickerRow, item.id === selectedId && styles.pickerRowActive]}
              onPress={() => { onSelect(item.id); onClose(); }}
              activeOpacity={0.7}
            >
              {item.color && (
                <View style={[styles.pickerDot, { backgroundColor: item.color }]} />
              )}
              <Text style={styles.pickerLabel}>{item.name}</Text>
              {item.id === selectedId && (
                <View style={styles.pickerCheck} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ─── Type Toggle ─────────────────────────────────────────────────────────────

const TYPES: { key: TransactionType; label: string }[] = [
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
  { key: 'transfer', label: 'Transfer' },
];

function TypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (t: TransactionType) => void;
}) {
  return (
    <View style={styles.typeRow}>
      {TYPES.map(({ key, label }, i) => (
        <Fragment key={key}>
          {i > 0 && <Text style={styles.typeSep}>·</Text>}
          <TouchableOpacity onPress={() => onChange(key)} activeOpacity={0.7}>
            <Text style={[
              styles.typeLabel,
              value === key && { color: TYPE_COLORS[key], fontFamily: 'Inter_600SemiBold' },
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        </Fragment>
      ))}
    </View>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export default function QuickLog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, walletId, categoryId, toWalletId, setType, setWalletId, setCategoryId, setToWalletId } =
    useQuickLogStore();

  const { data: wallets } = useWallets();
  const { data: categories } = useCategories(type === 'transfer' ? undefined : type as 'expense' | 'income');
  const createTx = useCreateTransaction();

  const [amountStr, setAmountStr] = useState('0');
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showToWalletPicker, setShowToWalletPicker] = useState(false);

  const handleKey = useNumPadAmount();

  const activeWallet = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];
  const activeCategory = categories?.find((c) => c.id === categoryId) ?? categories?.[0];
  const activeToWallet = wallets?.find((w) => w.id === toWalletId && w.id !== activeWallet?.id);

  const currency = activeWallet?.currency ?? 'THB';
  const symbol = currencySymbol(currency);
  const amount = parseFloat(amountStr) || 0;
  const typeColor = TYPE_COLORS[type];

  const effectiveWalletId = activeWallet?.id ?? null;
  const effectiveCategoryId = type !== 'transfer' ? (activeCategory?.id ?? null) : null;
  const effectiveToWalletId = type === 'transfer' ? (activeToWallet?.id ?? null) : null;

  async function handleSave() {
    if (amount <= 0) { Alert.alert('Enter an amount'); return; }
    if (!effectiveWalletId) { Alert.alert('Select a wallet'); return; }
    if (type === 'transfer' && !effectiveToWalletId) { Alert.alert('Select a destination wallet'); return; }

    try {
      await createTx.mutateAsync({
        wallet_id: effectiveWalletId,
        category_id: effectiveCategoryId,
        to_wallet_id: effectiveToWalletId,
        type,
        amount,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Type toggle */}
      <TypeToggle value={type} onChange={setType} />

      {/* Amount display */}
      <View style={styles.amountRow}>
        <Text style={[styles.currencySymbol, { color: typeColor }]}>{symbol}</Text>
        <Text style={[styles.amount, { color: typeColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatAmount(amount)}
        </Text>
      </View>

      {/* Pills */}
      <View style={styles.pills}>
        <PillButton
          label={activeWallet?.name ?? 'Wallet'}
          onPress={() => setShowWalletPicker(true)}
          active={!!activeWallet}
        />
        {type === 'transfer' ? (
          <PillButton
            label={activeToWallet?.name ?? 'To wallet'}
            onPress={() => setShowToWalletPicker(true)}
            active={!!activeToWallet}
          />
        ) : (
          <PillButton
            label={activeCategory?.name ?? 'Category'}
            onPress={() => setShowCategoryPicker(true)}
            active={!!activeCategory}
          />
        )}
      </View>

      {/* NumPad */}
      <View style={styles.numpad}>
        <NumPad onKey={(key) => setAmountStr((prev) => handleKey(prev, key))} />
      </View>

      {/* Save */}
      <Button
        label="Save"
        onPress={handleSave}
        loading={createTx.isPending}
        style={[styles.saveBtn, { backgroundColor: typeColor }]}
      />

      {/* Pickers */}
      <PickerModal
        visible={showWalletPicker}
        title="Select wallet"
        items={wallets ?? []}
        selectedId={effectiveWalletId}
        onSelect={(id) => { setWalletId(id); }}
        onClose={() => setShowWalletPicker(false)}
      />
      <PickerModal
        visible={showCategoryPicker}
        title="Select category"
        items={(categories ?? []).filter((c) => c.kind === type)}
        selectedId={effectiveCategoryId}
        onSelect={(id) => { setCategoryId(id); }}
        onClose={() => setShowCategoryPicker(false)}
      />
      <PickerModal
        visible={showToWalletPicker}
        title="To wallet"
        items={(wallets ?? []).filter((w) => w.id !== effectiveWalletId)}
        selectedId={effectiveToWalletId}
        onSelect={(id) => { setToWalletId(id); }}
        onClose={() => setShowToWalletPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeSep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textDim,
  },
  typeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textDim,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  currencySymbol: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    paddingBottom: 6,
  },
  amount: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 52,
    fontVariant: ['tabular-nums'],
    maxWidth: 280,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numpad: { flex: 1 },
  saveBtn: { marginTop: 4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  pickerRowActive: { backgroundColor: colors.bgInput },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  pickerCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});


// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal<T extends { id: string; name: string; color?: string | null }>({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pickerRow, item.id === selectedId && styles.pickerRowActive]}
              onPress={() => { onSelect(item.id); onClose(); }}
              activeOpacity={0.7}
            >
              {item.color && (
                <View style={[styles.pickerDot, { backgroundColor: item.color }]} />
              )}
              <Text style={styles.pickerLabel}>{item.name}</Text>
              {item.id === selectedId && (
                <View style={styles.pickerCheck} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ─── Type Toggle ─────────────────────────────────────────────────────────────

const TYPES: { key: TransactionType; label: string }[] = [
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
  { key: 'transfer', label: 'Transfer' },
];

function TypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (t: TransactionType) => void;
}) {
  return (
    <View style={styles.typeRow}>
      {TYPES.map(({ key, label }, i) => (
        <Fragment key={key}>
          {i > 0 && <Text style={styles.typeSep}>·</Text>}
          <TouchableOpacity onPress={() => onChange(key)} activeOpacity={0.7}>
            <Text style={[styles.typeLabel, value === key && styles.typeLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        </Fragment>
      ))}
    </View>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export default function QuickLog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, walletId, categoryId, toWalletId, setType, setWalletId, setCategoryId, setToWalletId } =
    useQuickLogStore();

  const { data: wallets } = useWallets();
  const { data: categories } = useCategories(type === 'transfer' ? undefined : type as 'expense' | 'income');
  const createTx = useCreateTransaction();

  const [amountStr, setAmountStr] = useState('0');
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showToWalletPicker, setShowToWalletPicker] = useState(false);

  const handleKey = useNumPadAmount();

  const activeWallet = wallets?.find((w) => w.id === walletId) ?? wallets?.[0];
  const activeCategory = categories?.find((c) => c.id === categoryId) ?? categories?.[0];
  const activeToWallet = wallets?.find((w) => w.id === toWalletId && w.id !== activeWallet?.id);

  const currency = activeWallet?.currency ?? 'THB';
  const symbol = currencySymbol(currency);
  const amount = parseFloat(amountStr) || 0;

  const effectiveWalletId = activeWallet?.id ?? null;
  const effectiveCategoryId = type !== 'transfer' ? (activeCategory?.id ?? null) : null;
  const effectiveToWalletId = type === 'transfer' ? (activeToWallet?.id ?? null) : null;

  async function handleSave() {
    if (amount <= 0) {
      Alert.alert('Enter an amount');
      return;
    }
    if (!effectiveWalletId) {
      Alert.alert('Select a wallet');
      return;
    }
    if (type === 'transfer' && !effectiveToWalletId) {
      Alert.alert('Select a destination wallet');
      return;
    }

    try {
      await createTx.mutateAsync({
        wallet_id: effectiveWalletId,
        category_id: effectiveCategoryId,
        to_wallet_id: effectiveToWalletId,
        type,
        amount,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Type toggle */}
      <TypeToggle value={type} onChange={setType} />

      {/* Amount display */}
      <View style={styles.amountRow}>
        <Text style={styles.currencySymbol}>{symbol}</Text>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {formatAmount(amount)}
        </Text>
      </View>

      {/* Pills */}
      <View style={styles.pills}>
        <PillButton
          label={activeWallet?.name ?? 'Wallet'}
          onPress={() => setShowWalletPicker(true)}
          active={!!activeWallet}
        />
        {type === 'transfer' ? (
          <PillButton
            label={activeToWallet?.name ?? 'To wallet'}
            onPress={() => setShowToWalletPicker(true)}
            active={!!activeToWallet}
          />
        ) : (
          <PillButton
            label={activeCategory?.name ?? 'Category'}
            onPress={() => setShowCategoryPicker(true)}
            active={!!activeCategory}
          />
        )}
      </View>

      {/* NumPad */}
      <View style={styles.numpad}>
        <NumPad onKey={(key) => setAmountStr((prev) => handleKey(prev, key))} />
      </View>

      {/* Save */}
      <Button
        label="Save"
        onPress={handleSave}
        loading={createTx.isPending}
        style={styles.saveBtn}
      />

      {/* Pickers */}
      <PickerModal
        visible={showWalletPicker}
        title="Select wallet"
        items={wallets ?? []}
        selectedId={effectiveWalletId}
        onSelect={(id) => { setWalletId(id); }}
        onClose={() => setShowWalletPicker(false)}
      />
      <PickerModal
        visible={showCategoryPicker}
        title="Select category"
        items={(categories ?? []).filter((c) => c.kind === type)}
        selectedId={effectiveCategoryId}
        onSelect={(id) => { setCategoryId(id); }}
        onClose={() => setShowCategoryPicker(false)}
      />
      <PickerModal
        visible={showToWalletPicker}
        title="To wallet"
        items={(wallets ?? []).filter((w) => w.id !== effectiveWalletId)}
        selectedId={effectiveToWalletId}
        onSelect={(id) => { setToWalletId(id); }}
        onClose={() => setShowToWalletPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },

  // Type toggle
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeSep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textDim,
  },
  typeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textDim,
  },
  typeLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.textMuted,
    paddingBottom: 6,
  },
  amount: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 56,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    maxWidth: 280,
  },

  // Pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // NumPad
  numpad: { flex: 1 },

  // Save
  saveBtn: { marginTop: 4 },

  // Picker
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  pickerRowActive: { backgroundColor: colors.bgInput },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  pickerCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
