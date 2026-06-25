import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { store, RootState } from '../store';
import { Colors } from '../theme/Colors';
import { restoreSession } from '../store/slices/authSlice';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const segments = useSegments(); // Tells us what screen we are currently on
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Redux state
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  // 1. Kick off the session restore when the app opens
  useEffect(() => {
    dispatch(restoreSession());
    const checkOnboarding = async () => {
      const hasSeen = await SecureStore.getItemAsync('hasSeenOnboarding');
      setIsFirstTime(hasSeen === null); // If null, they are a first-time user
    };
    checkOnboarding();
  }, [dispatch]);

  // 2. Handle Routing and Splash Screen hiding

  useEffect(() => {
    // Wait until both Auth and Onboarding checks are done
    if (isLoading || isFirstTime === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const isRoot = segments.length === 0 || segments[0] === undefined;

    // Hide Splash Screen
    SplashScreen.hideAsync();

    if (isAuthenticated) {
      // 1. If logged in, always go to tabs
      if (inAuthGroup || isRoot) {
        router.replace('/(tabs)');
      }
    } else {
      // 2. If NOT logged in...
      if (isFirstTime) {
        // ...and first time user, keep them on onboarding (index)
        if (!isRoot && !inAuthGroup) router.replace('/');
      } else {
        // ...and NOT first time, force them to login
        if (isRoot || !inAuthGroup) {
          router.replace('/auth/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, isFirstTime, segments]);

  // Return null or a blank view while loading so we don't flash the wrong screen
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/verify" />
      <Stack.Screen name="auth/biometrics" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sub"/>
    </Stack>
  );
}

// Wrap the Navigator in the Provider
export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}