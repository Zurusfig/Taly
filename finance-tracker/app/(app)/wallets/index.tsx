import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/lib/utils';
import { useWallets } from '@/hooks/useWallets';

export default function WalletsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: wallets, isLoading } = useWallets();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Wallets</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/wallets/new')} style={styles.back}>
          <Plus size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(app)/wallets/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.colorDot, { backgroundColor: item.color ?? colors.accent }]} />
              <View style={styles.mid}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.type}>{item.type}</Text>
              </View>
              <Text style={styles.balance}>
                {formatCurrency(item.balance, item.currency)}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No wallets yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { padding: 4, width: 40 },
  title: {
    flex: 1,
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    color: colors.text,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  mid: { flex: 1, gap: 2 },
  name: { fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.text },
  type: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textDim, textTransform: 'capitalize' },
  balance: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textMuted },
});
