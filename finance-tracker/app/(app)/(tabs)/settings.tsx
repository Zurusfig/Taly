import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Wallet, Tag, Target, Repeat, BarChart2, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { queryClient } from '@/lib/queryClient';

function SettingsRow({
  icon, label, onPress, destructive,
}: {
  icon: React.ReactNode; label: string; onPress: () => void; destructive?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
      <ChevronRight size={16} color={colors.textDim} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          queryClient.clear();
        },
      },
    ]);
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Manage</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={<Wallet size={18} color={colors.textMuted} />}
            label="Wallets"
            onPress={() => router.push('/(app)/wallets')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<Tag size={18} color={colors.textMuted} />}
            label="Categories"
            onPress={() => router.push('/(app)/categories')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<Target size={18} color={colors.textMuted} />}
            label="Budgets"
            onPress={() => router.push('/(app)/budgets')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<Repeat size={18} color={colors.textMuted} />}
            label="Subscriptions"
            onPress={() => router.push('/(app)/subscriptions')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<BarChart2 size={18} color={colors.textMuted} />}
            label="Portfolio"
            onPress={() => router.push('/(app)/assets')}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={<LogOut size={18} color={colors.danger} />}
            label="Sign out"
            onPress={handleSignOut}
            destructive
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  screenTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },
  group: { marginHorizontal: 16, marginTop: 24, gap: 8 },
  groupLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textDim,
    textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4,
  },
  card: { backgroundColor: colors.bgElevated, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, gap: 12 },
  rowIcon: { width: 24, alignItems: 'center' },
  rowLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
