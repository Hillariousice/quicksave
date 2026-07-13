import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Platform, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { socketService } from '@/api/services/socket.service';

export default function PayoutToast() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [toastData, setToastData] = useState<{ amount: number, groupName: string } | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current; // Start hidden

  useEffect(() => {
    // Listen for the custom payout event
    const handlePayout = (data: any) => {
      setToastData(data);
      
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      // Auto-hide after 5 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastData(null));
      }, 5000);
    };

    socketService.onPayoutReceived(handlePayout);

    return () => socketService.offPayoutReceived(handlePayout);
  }, [slideAnim]);

  if (!toastData) return null;

  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(toastData.amount).replace('.00', '');

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <SafeAreaView>
        <View style={[styles.toast, { backgroundColor: theme.inputBg, borderColor: theme.primary }]}>
          <View style={[styles.iconBg, { backgroundColor: theme.primary + '20' }]}>
            <MaterialCommunityIcons name="party-popper" size={24} color={theme.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Payout Received! 🎉</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {formattedAmount} from {toastData.groupName} was just credited to your wallet.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, paddingHorizontal: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: Platform.OS === 'android' ? 40 : 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  iconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18 },
});