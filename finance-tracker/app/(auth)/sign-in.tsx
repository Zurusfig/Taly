import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

export default function SignIn() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
