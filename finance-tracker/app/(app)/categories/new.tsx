import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateCategory } from '@/hooks/useCategories';
import type { CategoryKind } from '@/lib/types';

const COLORS = ['#61988E', '#E67E22', '#3498DB', '#9B59B6', '#E74C3C', '#27AE60', '#F39C12', '#95A5A6', '#E91E63', '#1ABC9C'];

export default function NewCategory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const createCategory = useCreateCategory();

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>((kindParam as CategoryKind) ?? 'expense');
  const [color, setColor] = useState(COLORS[0]);

  async function handleSave() {
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim(), kind, icon: null, color });
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
        <Text style={styles.title}>New Category</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Category name" placeholder="e.g. Groceries" value={name} onChangeText={setName} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.kindRow}>
            {(['expense', 'income'] as CategoryKind[]).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setKind(k)}
                style={[styles.kindChip, kind === k && styles.kindChipActive]}
              >
                <Text style={[styles.kindChipText, kind === k && styles.kindChipTextActive]}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
          label="Create category"
          onPress={handleSave}
          loading={createCategory.isPending}
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
  kindRow: { flexDirection: 'row', gap: 8 },
  kindChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  kindChipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  kindChipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted },
  kindChipTextActive: { color: colors.text },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: colors.text },
  saveBtn: { marginTop: 8 },
});
