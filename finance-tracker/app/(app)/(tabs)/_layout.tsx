import { Tabs } from 'expo-router';
import { Home, List, Settings } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarShowLabel: false,
        tabBarBackground: () => <View style={styles.barBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ tabBarIcon: ({ color }) => <List size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ color }) => <Settings size={24} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 0,
    elevation: 0,
    height: 76,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.bgElevated,
  },
  barBg: { flex: 1, backgroundColor: colors.bgElevated },
});
