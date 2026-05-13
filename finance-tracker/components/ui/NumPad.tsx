import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete } from 'lucide-react-native';
import { colors } from '@/theme/colors';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

interface NumPadProps {
  onKey: (key: string) => void;
}

export function NumPad({ onKey }: NumPadProps) {
  return (
    <View style={styles.grid}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => onKey(key)}
              activeOpacity={0.6}
            >
              {key === '⌫' ? (
                <Delete size={22} color={colors.text} />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

export function useNumPadAmount(initial = '0') {
  const handle = (prev: string, key: string): string => {
    if (key === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
    if (key === '.') return prev.includes('.') ? prev : prev + '.';
    if (prev === '0') return key;
    const parts = prev.split('.');
    if (parts.length === 2 && parts[1].length >= 2) return prev;
    return prev + key;
  };
  return handle;
}

const styles = StyleSheet.create({
  grid: { gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  key: {
    flex: 1,
    height: 60,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: colors.text,
  },
});
