import { useEffect, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import {
  useFonts,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

// Expo Router calls SplashScreen.hideAsync() for every new view controller it opens
// (sheets, modals, etc.), but the splash was only registered on the root controller.
// Patch hideAsync so every caller — including Expo Router internals — silently swallows
// the "No native splash screen registered" rejection instead of surfacing it.
const _origHide = SplashScreen.hideAsync;
SplashScreen.hideAsync = () => _origHide().catch(() => {});

LogBox.ignoreLogs(['No native splash screen registered']);

function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    // Handle magic-link token from deep link URL (fragment or query params)
    async function handleUrl(url: string) {
      if (!url.includes('access_token')) return;
      // Tokens arrive in the fragment (#access_token=...) — split manually
      const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
      const params = Object.fromEntries(new URLSearchParams(fragment)) as Record<string, string>;
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    }

    // Cold-launch: app opened via magic link tap
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });

    // Warm-launch: app already open when link is tapped
    const linkSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  return { session, loading };
}

function RootLayoutInner() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const { session, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const segments = useSegments();

  const ready = (fontsLoaded || !!fontError) && !authLoading;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});

    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuth) {
      router.replace('/(app)');
    }
  }, [ready, session, segments]);

  if (!ready) return <View style={styles.bg} />;

  return (
    <View style={styles.bg}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
});
