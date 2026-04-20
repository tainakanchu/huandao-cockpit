import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useT } from '@/lib/i18n';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import OfflineBanner from '@/components/common/OfflineBanner';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Hide splash screen once fonts load or after a short delay
    if (loaded) {
      SplashScreen.hideAsync();
    } else {
      // Fallback: hide splash after 2 seconds even if fonts fail
      const timer = setTimeout(() => SplashScreen.hideAsync(), 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  // Render even if fonts haven't loaded yet (use system fonts as fallback)
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const t = useT();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1B7A3D' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => <LanguageSwitcher />,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t.appTitle,
            headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="today"
          options={{
            title: t.todayPlan,
            headerBackTitle: t.home,
          }}
        />
        <Stack.Screen
          name="next"
          options={{
            title: t.riding,
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="plan"
          options={{
            title: t.tripPlan,
            headerBackTitle: t.home,
          }}
        />
        <Stack.Screen
          name="summary"
          options={{
            title: t.daySummary,
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: t.history,
            headerBackTitle: t.home,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
