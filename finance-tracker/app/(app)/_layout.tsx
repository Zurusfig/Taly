import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="quick-log"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.72, 1.0],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: '#2A2B2A' },
        }}
      />
      <Stack.Screen name="transaction/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="wallets/index" />
      <Stack.Screen name="wallets/new" />
      <Stack.Screen name="wallets/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/new" />
      <Stack.Screen name="categories/[id]" />
      <Stack.Screen name="budgets/index" />
      <Stack.Screen name="budgets/new" />
      <Stack.Screen name="budgets/[id]" />
    </Stack>
  );
}
