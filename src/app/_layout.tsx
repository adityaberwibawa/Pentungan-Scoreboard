import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SplashScreen, Stack } from 'expo-router';
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

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, [loadAll]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, ready]);

  if ((!fontsLoaded && !fontError) || !ready) {
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
