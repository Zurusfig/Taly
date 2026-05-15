import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useAssets, useUpdateAsset, useDeleteAsset, useRefreshPrices } from '@/hooks/useAssets';
import { usePortfolioStore } from '@/stores/portfolioStore';
import type { Asset } from '@/lib/types';

const ASSET_TYPES: { key: Asset['type']; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'etf', label: 'ETF' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'gold', label: 'Gold' },
  { key: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'THB', 'EUR', 'SGD', 'JPY'];

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: assets } = useAssets();
  const update = useUpdateAsset();
  const remove = useDeleteAsset();
  const refreshPrices = useRefreshPrices();
  const { usdToThb } = usePortfolioStore();

  const asset = assets?.find((a) => a.id === id);

  const [assetType, setAssetType] = useState<Asset['type']>('stock');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setAssetType(asset.type);
    setName(asset.name);
    setSymbol(asset.symbol ?? '');
    setQuantity(String(asset.quantity));
    setAvgCost(asset.avg_cost_per_unit != null ? String(asset.avg_cost_per_unit) : '');
    setCurrency(asset.currency);
  }, [asset?.id]);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Enter an asset name.'); return; }
    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) { Alert.alert('Required', 'Enter a valid quantity.'); return; }
    try {
      await update.mutateAsync({
        id: id!,
        type: assetType,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase() || null,
        quantity: qty,
        avg_cost_per_unit: avgCost ? parseFloat(avgCost) : null,
        currency,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function handleDelete() {
    Alert.alert('Remove holding', `Remove "${asset?.name}" from your portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id!);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  function handleRefreshThis() {
    if (!asset || !asset.symbol) return;
    refreshPrices.mutate([asset], {
      onError: (e: any) => Alert.alert('Refresh failed', e.message),
      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    });
  }

  if (!asset) {
    return (
      <View style={[styles.flex, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const currentPrice = asset.last_price;
  const currentVal = asset.quantity * (currentPrice ?? asset.avg_cost_per_unit ?? 0);
  const costBasis = asset.quantity * (asset.avg_cost_per_unit ?? 0);
  const gain = currentPrice != null && asset.avg_cost_per_unit != null
    ? currentVal - costBasis : null;
  const gainPct = gain !== null && costBasis > 0
    ? (gain / costBasis) * 100 : null;
  const isUp = (gain ?? 0) >= 0;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{asset.symbol ?? asset.name}</Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={8}>
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Stats card */}
        {!editing && (
          <View style={styles.statsCard}>
            <View style={styles.statsMain}>
              <Text style={styles.statsSymbol}>{asset.symbol ?? asset.name}</Text>
              <Text style={styles.statsName} numberOfLines={2}>{asset.name}</Text>
              <Text style={styles.statsValue}>${formatAmount(currentVal)}</Text>
              <Text style={styles.statsThb}>฿{formatAmount(currentVal * usdToThb)}</Text>
            </View>

            {gain !== null && gainPct !== null && (
              <View style={[styles.gainBadge, { backgroundColor: isUp ? colors.accentMuted : '#4A2A28' }]}>
                {isUp
                  ? <TrendingUp size={14} color={colors.accent} />
                  : <TrendingDown size={14} color={colors.danger} />
                }
                <Text style={[styles.gainPct, { color: isUp ? colors.accent : colors.danger }]}>
                  {isUp ? '+' : ''}{gainPct.toFixed(2)}%
                </Text>
              </View>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Quantity</Text>
                <Text style={styles.statValue2}>
                  {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg cost</Text>
                <Text style={styles.statValue2}>
                  {asset.avg_cost_per_unit != null ? `$${formatAmount(asset.avg_cost_per_unit)}` : '—'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Current price</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.statValue2}>
                    {currentPrice != null ? `$${formatAmount(currentPrice)}` : '—'}
                  </Text>
                  {asset.symbol && currentPrice == null && (
                    <AlertTriangle size={12} color={colors.warning} />
                  )}
                </View>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Cost basis</Text>
                <Text style={styles.statValue2}>${formatAmount(costBasis)}</Text>
              </View>
            </View>

            {asset.last_price_updated_at && (
              <Text style={styles.updatedAt}>
                Price updated {formatDistanceToNow(new Date(asset.last_price_updated_at), { addSuffix: true })}
              </Text>
            )}

            {asset.symbol && (
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={handleRefreshThis}
                disabled={refreshPrices.isPending}
              >
                <Text style={styles.refreshBtnText}>
                  {refreshPrices.isPending ? 'Refreshing…' : 'Refresh price'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>Edit holding</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit form */}
        {editing && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>TYPE</Text>
              <View style={styles.chips}>
                {ASSET_TYPES.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAssetType(key)}
                    style={[styles.chip, assetType === key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, assetType === key && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>NAME</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textDim} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>SYMBOL</Text>
              <TextInput
                style={styles.input}
                value={symbol}
                onChangeText={setSymbol}
                autoCapitalize="characters"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>QUANTITY</Text>
              <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholderTextColor={colors.textDim} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>AVG COST PER UNIT</Text>
              <TextInput style={styles.input} value={avgCost} onChangeText={setAvgCost} keyboardType="decimal-pad" placeholderTextColor={colors.textDim} />
            </View>

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

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, update.isPending && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={update.isPending}
              >
                <Text style={styles.saveBtnText}>{update.isPending ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: colors.text },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 20 },

  statsCard: { backgroundColor: colors.bgElevated, borderRadius: 16, padding: 18, gap: 14 },
  statsMain: { gap: 3 },
  statsSymbol: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },
  statsName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted },
  statsValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 32,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  statsThb: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  gainPct: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { width: '46%', gap: 3 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue2: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  updatedAt: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textDim },

  refreshBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.accent },

  editBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },

  field: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textDim, letterSpacing: 0.8 },
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

  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.textMuted },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.bg },
});
