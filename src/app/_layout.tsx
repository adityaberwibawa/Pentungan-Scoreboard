import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../theme';
import { useStore } from '../store';
import { useAuthStore } from '../auth/useAuthStore';
import { useAutoLock } from '../auth/useAutoLock';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function useAuthGate() {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === 'lock' || segments[0] === 'setup-pin';
    if (status === 'setup' && !inAuth) {
      router.replace('/setup-pin');
    } else if (status === 'locked' && segments[0] !== 'lock') {
      router.replace('/lock');
    } else if (status === 'unlocked' && inAuth) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
  });
  const ready = useStore((s) => s.ready);
  const loadAll = useStore((s) => s.loadAll);
  const authStatus = useAuthStore((s) => s.status);
  const authInit = useAuthStore((s) => s.init);

  useAutoLock(authStatus === 'unlocked');

  useEffect(() => {
    loadAll().catch(() => undefined);
    authInit().catch(() => undefined);
  }, [loadAll, authInit]);

  useAuthGate();

  useEffect(() => {
    if ((fontsLoaded || fontError) && ready && authStatus !== 'loading') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, ready, authStatus]);

  if ((!fontsLoaded && !fontError) || !ready || authStatus === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={Colors.accent}
          accessibilityLabel="Memuat PentungScore"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.base },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="setup-pin"
          options={{ presentation: 'card', gestureEnabled: false }}
        />
        <Stack.Screen name="lock" options={{ presentation: 'card', gestureEnabled: false }} />
        <Stack.Screen
          name="security"
          options={{ presentation: 'card', gestureEnabled: true }}
        />
        <Stack.Screen
          name="create"
          options={{ presentation: 'card', gestureEnabled: true }}
        />
        <Stack.Screen
          name="game/[id]"
          options={{ presentation: 'card', gestureEnabled: true }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
