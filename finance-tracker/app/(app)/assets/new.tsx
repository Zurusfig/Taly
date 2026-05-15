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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { colors } from '@/theme/colors';
import { useCreateAsset, useRefreshPrices, useSearchSymbols, type SymbolResult } from '@/hooks/useAssets';
import { useAssets } from '@/hooks/useAssets';
import type { Asset } from '@/lib/types';

const ASSET_TYPES: { key: Asset['type']; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'etf', label: 'ETF' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'gold', label: 'Gold' },
  { key: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'THB', 'EUR', 'SGD', 'JPY'];

const SEARCH_TYPES: Asset['type'][] = ['stock', 'etf'];

function exchangeBadge(type: string): string {
  // Simplified — Finnhub type field e.g. "Common Stock", "ETF", "Crypto"
  if (type?.toLowerCase().includes('etf')) return 'ETF';
  if (type?.toLowerCase().includes('crypto')) return 'CRYPTO';
  return type?.slice(0, 6) || '—';
}

export default function NewAssetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: allAssets } = useAssets();
  const create = useCreateAsset();
  const refreshPrices = useRefreshPrices();

  const [assetType, setAssetType] = useState<Asset['type']>('stock');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolResult | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showSearch, setShowSearch] = useState(true);

  const useSymbolSearch = SEARCH_TYPES.includes(assetType);

  // Debounce symbol search
  useEffect(() => {
    if (!useSymbolSearch) return;
    const t = setTimeout(() => setDebouncedQuery(symbolQuery), 300);
    return () => clearTimeout(t);
  }, [symbolQuery, useSymbolSearch]);

  const { data: searchResults, isLoading: searching } = useSearchSymbols(
    useSymbolSearch && showSearch ? debouncedQuery : '',
  );

  function selectResult(r: SymbolResult) {
    setSelectedSymbol(r);
    setSymbol(r.displaySymbol ?? r.symbol);
    setName(r.description);
    setShowSearch(false);
    setSymbolQuery(r.displaySymbol ?? r.symbol);
    Haptics.selectionAsync();
  }

  function clearSelection() {
    setSelectedSymbol(null);
    setSymbol('');
    setName('');
    setSymbolQuery('');
    setShowSearch(true);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Enter an asset name.'); return; }
    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) { Alert.alert('Required', 'Enter a valid quantity.'); return; }

    try {
      const created = await create.mutateAsync({
        type: assetType,
        name: name.trim(),
        symbol: (useSymbolSearch ? symbol : symbol.trim().toUpperCase()) || null,
        quantity: qty,
        avg_cost_per_unit: avgCost ? parseFloat(avgCost) : null,
        currency,
      });

      // Immediately refresh price for the new asset if it has a symbol
      if (created.symbol && allAssets) {
        refreshPrices.mutate([created, ...allAssets]);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const qtyDecimalPlaces = assetType === 'crypto' ? 6 : 4;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add asset</Text>
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
                onPress={() => { setAssetType(key); clearSelection(); }}
                style={[styles.chip, assetType === key && styles.chipActive]}
              >
                <Text style={[styles.chipText, assetType === key && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Symbol search (stock/ETF) */}
        {useSymbolSearch && (
          <View style={styles.field}>
            <Text style={styles.label}>SYMBOL</Text>
            {selectedSymbol ? (
              <TouchableOpacity style={styles.selectedSymbol} onPress={clearSelection}>
                <View style={styles.selectedLeft}>
                  <Text style={styles.selectedSym}>{selectedSymbol.displaySymbol ?? selectedSymbol.symbol}</Text>
                  <Text style={styles.selectedDesc} numberOfLines={1}>{selectedSymbol.description}</Text>
                </View>
                <Check size={16} color={colors.accent} />
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.searchRow}>
                  <Search size={16} color={colors.textDim} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="AAPL, NVDA, VOO…"
                    placeholderTextColor={colors.textDim}
                    value={symbolQuery}
                    onChangeText={(t) => { setSymbolQuery(t); setShowSearch(true); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {searching && <ActivityIndicator size="small" color={colors.textDim} style={{ marginRight: 12 }} />}
                </View>

                {(searchResults ?? []).length > 0 && showSearch && (
                  <View style={styles.results}>
                    {searchResults!.map((r) => (
                      <TouchableOpacity key={r.symbol} style={styles.resultRow} onPress={() => selectResult(r)}>
                        <View style={styles.resultLeft}>
                          <Text style={styles.resultSymbol}>{r.displaySymbol ?? r.symbol}</Text>
                          <Text style={styles.resultDesc} numberOfLines={1}>{r.description}</Text>
                        </View>
                        <View style={styles.exchangeBadge}>
                          <Text style={styles.exchangeText}>{exchangeBadge(r.type)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <Text style={styles.poweredBy}>Symbol search powered by Finnhub</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Manual name/symbol (non-stock) */}
        {!useSymbolSearch && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Gold (Hua Seng Heng)"
                placeholderTextColor={colors.textDim}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>SYMBOL (optional, for price tracking)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. XAUUSD, BTC-USD"
                placeholderTextColor={colors.textDim}
                value={symbol}
                onChangeText={setSymbol}
                autoCapitalize="characters"
              />
            </View>
          </>
        )}

        {/* Name — auto-filled for stock/ETF, manual for others */}
        {useSymbolSearch && selectedSymbol && (
          <View style={styles.field}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textDim}
            />
          </View>
        )}

        {/* Quantity */}
        <View style={styles.field}>
          <Text style={styles.label}>QUANTITY (up to {qtyDecimalPlaces} decimals)</Text>
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
          <Text style={styles.label}>AVG COST PER UNIT (optional)</Text>
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

        <TouchableOpacity
          style={[styles.saveBtn, create.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={create.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{create.isPending ? 'Saving…' : 'Add to portfolio'}</Text>
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

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text,
  },
  results: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  resultLeft: { flex: 1, gap: 2 },
  resultSymbol: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  resultDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  exchangeBadge: {
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  exchangeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  poweredBy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: 8,
  },

  selectedSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: 10,
  },
  selectedLeft: { flex: 1, gap: 2 },
  selectedSym: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 18,
    color: colors.text,
  },
  selectedDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },

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
