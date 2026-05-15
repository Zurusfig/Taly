import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { colors } from '@/theme/colors';
import { useCreateAsset } from '@/hooks/useAssets';
import type { Asset } from '@/lib/types';

const ASSET_TYPES: { key: Asset['type']; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'etf', label: 'ETF' },
  { key: 'gold', label: 'Gold' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'THB', 'EUR', 'JPY', 'SGD'];

export default function NewAssetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const create = useCreateAsset();

  const [type, setType] = useState<Asset['type']>('stock');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [currency, setCurrency] = useState('USD');

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Enter an asset name.'); return; }
    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) { Alert.alert('Required', 'Enter a valid quantity.'); return; }

    try {
      await create.mutateAsync({
        type,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase() || null,
        quantity: qty,
        avg_cost_per_unit: avgCost ? parseFloat(avgCost) : null,
        currency,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New asset</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>TYPE</Text>
          <View style={styles.chips}>
            {ASSET_TYPES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setType(key)}
                style={[styles.chip, type === key && styles.chipActive]}
              >
                <Text style={[styles.chipText, type === key && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Apple Inc."
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Symbol */}
        <View style={styles.field}>
          <Text style={styles.label}>SYMBOL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AAPL"
            placeholderTextColor={colors.textDim}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
        </View>

        {/* Quantity */}
        <View style={styles.field}>
          <Text style={styles.label}>QUANTITY</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textDim}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Avg cost */}
        <View style={styles.field}>
          <Text style={styles.label}>AVG COST / UNIT (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textDim}
            value={avgCost}
            onChangeText={setAvgCost}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Currency */}
        <View style={styles.field}>
          <Text style={styles.label}>CURRENCY</Text>
          <View style={styles.chips}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCurrency(c)}
                style={[styles.chip, currency === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, create.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={create.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{create.isPending ? 'Saving…' : 'Add asset'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: colors.text },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  field: { gap: 8 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.accent },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.bg },
});
