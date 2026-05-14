import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors } from '@/theme/colors';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  dotColor?: string | null;
}

export function PillButton({ label, onPress, active, dotColor }: PillButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.pill, active && styles.pillActive]}
    >
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={13} color={active ? colors.text : colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    borderColor: colors.accentMuted,
    backgroundColor: colors.accentMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    maxWidth: 120,
  },
  labelActive: { color: colors.text },
});
