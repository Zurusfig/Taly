import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, LogBox, AppState } from 'react-native';
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
import { LockScreen } from '@/components/LockScreen';
import { getBiometricEnabled, authenticate } from '@/hooks/useBiometric';
import { usePrefsStore } from '@/stores/prefsStore';

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
  const [locked, setLocked] = useState(false);
  const hydrated = useRef(false);

  const ready = (fontsLoaded || !!fontError) && !authLoading;

  // Biometric gate: check on ready + re-lock when app comes back to foreground
  useEffect(() => {
    if (!ready || !session) return;
    getBiometricEnabled().then((enabled) => {
      if (enabled) setLocked(true);
    });
  }, [ready, session]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && session) {
        getBiometricEnabled().then((enabled) => {
          if (enabled) setLocked(true);
        });
      }
    });
    return () => sub.remove();
  }, [session]);

  // Hydrate prefs store once
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    usePrefsStore.getState().hydrate();
  }, []);

  // Daily rollover: invalidate progress cache when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        queryClient.invalidateQueries({ queryKey: ['user_progress'] });
        queryClient.invalidateQueries({ queryKey: ['streak'] });
      }
    });
    return () => sub.remove();
  }, []);

  // Hide splash once — not tied to navigation changes.
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Guard: redirect to/from auth only when session or readiness changes.
  // Intentionally excludes `segments` from deps — sheet/modal navigation must not
  // re-trigger this or it can race with Supabase token refresh and dismiss the sheet.
  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuth) {
      router.replace('/(app)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session]);

  if (!ready) return <View style={styles.bg} />;

  if (locked && session) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

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
