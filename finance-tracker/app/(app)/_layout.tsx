import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="quick-log" options={{ presentation: 'formSheet' }} />
      <Stack.Screen name="transaction/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="wallets/index" />
      <Stack.Screen name="wallets/new" />
      <Stack.Screen name="wallets/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/new" />
      <Stack.Screen name="categories/[id]" />
    </Stack>
  );
}
