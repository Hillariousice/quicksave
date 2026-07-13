import { useEffect, useRef } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router'; 
import { useAppSelector, useAppDispatch } from '../store';
import { AuthService } from '@/api/services/auth.service';
import { Colors } from '@/theme/Colors';
import { fetchWalletData } from '@/store/slices/walletSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Refs to hold our listeners so we can clean them up later
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Helper function to route users based on notification payload!
  const handleNotificationTap = (data: any) => {
    if (!data || !data.type) {
      router.push('/sub/notification'); // Fallback
      return;
    }

    // Smart Routing based on the 'type' string from your Backend
    switch (data.type) {
      case 'PAYOUT':
        // Deep link to the gorgeous receipt screen we built!
        router.push({
          pathname: '/sub/wallet/transaction-receipt',
          params: { data: JSON.stringify({ ...data, type: 'Payout' }) }
        });
        break;
      case 'CONTRIBUTION_DUE':
      case 'NEW_MEMBER':
        // Deep link straight into the specific Ajo group
        if (data.groupId) {
          router.push(`/sub/groups/${data.groupId}`);
        }
        break;
      case 'CONTRIBUTION_CONFIRMED':
        // Deep link to the Contribution Success screen
        router.push({
          pathname: '/sub/notification/contribution',
          params: { data: JSON.stringify(data) }
        });
        break;
      default:
        router.push('/(tabs)'); // Fallback to Dashboard
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // --- 1. REGISTRATION LOGIC (From Yesterday) ---
    const registerForPushNotificationsAsync = async () => {
      // ... keep your existing permission and token fetching code here ...
      // e.g., const pushTokenString = (await Notifications.getExpoPushTokenAsync(...)).data;
      // await AuthService.syncPushToken(pushTokenString);
    };
    registerForPushNotificationsAsync();

    // --- 2. FOREGROUND LISTENER ---
    // Fires when a notification arrives WHILE the app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      console.log('📬 Notification received in foreground:', data);
      
      // If money moved, silently update the Redux wallet balance in the background!
      if (data.type === 'PAYOUT' || data.type === 'CONTRIBUTION_CONFIRMED') {
        dispatch(fetchWalletData());
      }
    });

    // --- 3. TAP LISTENER (Background / Killed State) ---
    // Fires when a user TAPS the notification banner from their lock screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Notification tapped! Payload:', data);
      handleNotificationTap(data);
    });

    // --- CLEANUP ---
     return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, dispatch, router]); 
}