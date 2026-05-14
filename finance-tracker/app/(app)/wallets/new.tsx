import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateWallet } from '@/hooks/useWallets';
import type { WalletType } from '@/lib/types';

const WALLET_TYPES: WalletType[] = ['bank', 'cash', 'credit', 'other'];
const COLORS = ['#61988E', '#E67E22', '#3498DB', '#9B59B6', '#E74C3C', '#27AE60', '#F39C12', '#95A5A6'];

export default function NewWallet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createWallet = useCreateWallet();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('THB');
  const [color, setColor] = useState(COLORS[0]);

  async function handleSave() {
    if (!name.trim()) return;
    try {
      await createWallet.mutateAsync({
        name: name.trim(),
        type,
        initial_balance: parseFloat(balance) || 0,
        currency,
        icon: null,
        color,
      });
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
        <Text style={styles.title}>New Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Wallet name" placeholder="e.g. SCB Bank" value={name} onChangeText={setName} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {WALLET_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Initial balance"
          placeholder="0.00"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
        />
        <Input
          label="Currency"
          placeholder="THB"
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          maxLength={3}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]}
              />
            ))}
          </View>
        </View>

        <Button
          label="Create wallet"
          onPress={handleSave}
          loading={createWallet.isPending}
          disabled={!name.trim()}
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  typeChipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted },
  typeChipTextActive: { color: colors.text },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: colors.text },
  saveBtn: { marginTop: 8 },
});
