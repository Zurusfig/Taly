import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useWallets, useUpdateWallet, useArchiveWallet } from '@/hooks/useWallets';
import type { WalletType } from '@/lib/types';

const WALLET_TYPES: WalletType[] = ['bank', 'cash', 'credit', 'other'];
const COLORS = ['#61988E', '#E67E22', '#3498DB', '#9B59B6', '#E74C3C', '#27AE60', '#F39C12', '#95A5A6'];

export default function EditWallet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: wallets } = useWallets();
  const updateWallet = useUpdateWallet();
  const archiveWallet = useArchiveWallet();

  const wallet = wallets?.find((w) => w.id === id);

  const [name, setName] = useState(wallet?.name ?? '');
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'bank');
  const [currency, setCurrency] = useState(wallet?.currency ?? 'THB');
  const [color, setColor] = useState(wallet?.color ?? COLORS[0]);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setCurrency(wallet.currency);
      setColor(wallet.color ?? COLORS[0]);
    }
  }, [wallet?.id]);

  if (!wallet) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSave() {
    if (!name.trim()) return;
    try {
      await updateWallet.mutateAsync({ id: wallet!.id, name: name.trim(), type, currency, color });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleArchive() {
    Alert.alert('Archive wallet', 'The wallet will be hidden but transactions are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveWallet.mutateAsync(wallet!.id);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
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
        <Text style={styles.title}>Edit Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Wallet name" value={name} onChangeText={setName} />

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
          label="Currency"
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

        <Button label="Save changes" onPress={handleSave} loading={updateWallet.isPending} disabled={!name.trim()} />
        <Button label="Archive wallet" variant="danger" onPress={handleArchive} loading={archiveWallet.isPending} />
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
});
