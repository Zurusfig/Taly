import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight, Wallet, Tag, Target, Repeat,
  TrendingUp, Download, Upload, Fingerprint, LogOut,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { queryClient } from '@/lib/queryClient';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { exportData, importData } from '@/hooks/useExportImport';
import {
  isBiometricAvailable,
  getBiometricEnabled,
  setBiometricEnabled,
  authenticate,
} from '@/hooks/useBiometric';
import { useStreak } from '@/hooks/useStreak';

function SettingsRow({
  icon, label, sublabel, onPress, destructive, loading,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row} disabled={loading}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {loading
        ? <ActivityIndicator size="small" color={colors.textDim} />
        : <ChevronRight size={16} color={colors.textDim} />
      }
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon, label, sublabel, value, onValueChange,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.bgInput, true: colors.accentMuted }}
        thumbColor={value ? colors.accent : colors.textDim}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showOnHome, setShowOnHome } = usePortfolioStore();
  const { data: streak } = useStreak();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    getBiometricEnabled().then(setBiometricEnabledState);
  }, []);

  async function handleBiometricToggle(value: boolean) {
    if (value) {
      // Require auth before enabling
      const ok = await authenticate();
      if (!ok) return;
    }
    await setBiometricEnabled(value);
    setBiometricEnabledState(value);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    Alert.alert(
      'Import data',
      'How would you like to import?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge (keep existing)',
          onPress: () => runImport('merge'),
        },
        {
          text: 'Overwrite everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Overwrite all data?',
              'This will delete all your current wallets, transactions, and categories.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Overwrite', style: 'destructive', onPress: () => runImport('overwrite') },
              ],
            );
          },
        },
      ],
    );
  }

  async function runImport(mode: 'overwrite' | 'merge') {
    setImporting(true);
    try {
      await importData(mode);
      Alert.alert('Import complete', 'Your data has been restored.');
    } catch (e: any) {
      Alert.alert('Import failed', e.message);
    } finally {
      setImporting(false);
    }
  }

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
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

      {/* Streak card */}
      {(streak?.current ?? 0) > 0 && (
        <View style={styles.streakCard}>
          <View>
            <Text style={styles.streakNum}>{streak!.current} day streak</Text>
            <Text style={styles.streakSub}>
              {streak!.todayLogged ? 'Logged today — keep it up!' : 'Log a transaction today to continue'}
            </Text>
          </View>
          {streak!.longest > 1 && (
            <View style={styles.streakBest}>
              <Text style={styles.streakBestLabel}>Best</Text>
              <Text style={styles.streakBestNum}>{streak!.longest}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Manage</Text>
        <View style={styles.card}>
          <SettingsRow icon={<Wallet size={18} color={colors.textMuted} />} label="Wallets" onPress={() => router.push('/(app)/wallets')} />
          <View style={styles.divider} />
          <SettingsRow icon={<Tag size={18} color={colors.textMuted} />} label="Categories" onPress={() => router.push('/(app)/categories')} />
          <View style={styles.divider} />
          <SettingsRow icon={<Target size={18} color={colors.textMuted} />} label="Budgets" onPress={() => router.push('/(app)/budgets')} />
          <View style={styles.divider} />
          <SettingsRow icon={<Repeat size={18} color={colors.textMuted} />} label="Subscriptions" onPress={() => router.push('/(app)/subscriptions')} />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Display</Text>
        <View style={styles.card}>
          <ToggleRow
            icon={<TrendingUp size={18} color={colors.textMuted} />}
            label="Show portfolio on Home"
            value={showOnHome}
            onValueChange={setShowOnHome}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Data</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={<Download size={18} color={colors.textMuted} />}
            label="Export data"
            sublabel="Save a JSON backup"
            onPress={handleExport}
            loading={exporting}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon={<Upload size={18} color={colors.textMuted} />}
            label="Import data"
            sublabel="Restore from JSON backup"
            onPress={handleImport}
            loading={importing}
          />
        </View>
      </View>

      {biometricAvailable && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Security</Text>
          <View style={styles.card}>
            <ToggleRow
              icon={<Fingerprint size={18} color={colors.textMuted} />}
              label="Biometric lock"
              sublabel="Require Face ID / fingerprint on open"
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
            />
          </View>
        </View>
      )}

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingTop: 4 },
  topBar: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  screenTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },

  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  streakNum: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 22, color: colors.text },
  streakSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, marginTop: 2 },
  streakBest: { alignItems: 'center', gap: 2 },
  streakBestLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBestNum: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: colors.textMuted },

  group: { marginHorizontal: 16, marginTop: 24, gap: 8 },
  groupLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textDim,
    textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4,
  },
  card: { backgroundColor: colors.bgElevated, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  rowIcon: { width: 24, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.text },
  rowSublabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textDim },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
