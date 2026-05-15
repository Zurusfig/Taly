import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { authenticate } from '@/hooks/useBiometric';

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  async function tryAuth() {
    const ok = await authenticate();
    if (ok) onUnlock();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Taly</Text>
      <Text style={styles.subtitle}>Locked</Text>

      <TouchableOpacity style={styles.btn} onPress={tryAuth} activeOpacity={0.8}>
        <Fingerprint size={32} color={colors.bg} />
        <Text style={styles.btnText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 40,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: colors.bg,
  },
});
