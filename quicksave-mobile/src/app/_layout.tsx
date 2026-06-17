import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';

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

  // 1. Kick off the session restore when the app opens
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // 2. Handle Routing and Splash Screen hiding
  useEffect(() => {
    if (isLoading) return; // Do nothing while we are checking the token

    // Hide splash screen once we know the auth state
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === 'auth'; // e.g., /auth/login, /auth/register

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in? Kick them to the Onboarding/Login screen
      router.replace('/'); 
    } else if (isAuthenticated && inAuthGroup) {
      // Logged in but trying to view Login/Register? Send them to the Dashboard
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Return null or a blank view while loading so we don't flash the wrong screen
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/verify" />
      <Stack.Screen name="auth/biometrics" />
      <Stack.Screen name="home" />
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