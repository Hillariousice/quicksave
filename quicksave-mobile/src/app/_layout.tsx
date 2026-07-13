import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { store, RootState, persistor, useAppSelector } from '../store';
import { Colors } from '../theme/Colors';
import { restoreSession } from '../store/slices/authSlice';
import { PersistGate } from 'redux-persist/integration/react'; 
import { injectStore } from '../api/client';
import NetInfo from '@react-native-community/netinfo';
import { setNetworkState } from '../store/slices/networkSlice';
import OfflineBanner from '../components/ui/offline-banner';
import { syncOfflineData } from '../store/slices/offlineQueueSlice';
import { socketService } from '@/api/services/socket.service';
import NewMemberToast from '@/components/ui/newmember-toast'; 
import PayoutToast from '@/components/ui/payout-toast';
import { usePushNotifications } from '@/hooks/use-push-notification';
import FabricIndicator from '@/components/ui/fabric-indicator';
import AppLockOverlay from '@/components/ui/applock-overlay';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

injectStore(store);

function NetworkAndUIWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<any>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);


  useEffect(() => {
    // Starts listening to network changes the second the app opens
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(setNetworkState(state));

      if (state.isConnected && state.isInternetReachable) {
        dispatch(syncOfflineData());
      }
    });

if (isAuthenticated) {
      // Connect to the real-time engine when logged in
      socketService.connect(dispatch);
    } else {
      // Disconnect when logged out so we don't leak memory
      socketService.disconnect();
    }
    // Cleanup the listener if the app is destroyed
   return () => {
      socketService.disconnect();
    };
    
  }, [isAuthenticated, dispatch]);

  usePushNotifications();
  return (
    <>
      <AppLockOverlay />
      <OfflineBanner /> 
      <PayoutToast />
      <NewMemberToast />
      <FabricIndicator />
      {children}
    </>
  );
}

function RootNavigator() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const segments = useSegments(); // Tells us what screen we are currently on
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Redux state
  const { isAuthenticated, isBooting } = useSelector((state: RootState) => state.auth);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  // 1. Kick off the session restore when the app opens
  useEffect(() => {
    dispatch(restoreSession());
    const checkOnboarding = async () => {
      const hasSeen = await SecureStore.getItemAsync('hasSeenOnboarding');
      setIsFirstTime(hasSeen !== null); // If null, they are a first-time user
    };
    checkOnboarding();
  }, [dispatch]);

  // 2. Handle Routing and Splash Screen hiding

  useEffect(() => {
    // Wait until both Auth and Onboarding checks are done
    if (isBooting || isFirstTime === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const isRoot = segments.length === 0 || segments[0] === undefined || segments[0] === '';

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
  }, [isAuthenticated, isBooting, isFirstTime, segments]);

  // Return null or a blank view while loading so we don't flash the wrong screen
  // if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/verify" />
      <Stack.Screen name="auth/biometrics" />
      <Stack.Screen name="(tabs)" options={{ navigationBarHidden: true }} />
      <Stack.Screen name="sub"/>
    </Stack>
  );
}

// Wrap the Navigator in the Provider
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NetworkAndUIWrapper>
          <RootNavigator />
        </NetworkAndUIWrapper>
      </PersistGate>
    </Provider>
     </GestureHandlerRootView>
  );
}