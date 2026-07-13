import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { lockApp, unlockApp } from '@/store/slices/authSlice';
import { promptBiometrics } from '@/utils/biometrics';
import { Colors } from '@/theme/Colors';

export default function AppLockOverlay() {
  const dispatch = useAppDispatch();
  const { isAppLocked, isAuthenticated } = useAppSelector(state => state.auth);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    // Check if the user opted in to biometrics on Day 34
    SecureStore.getItemAsync('biometricsEnabled').then(val => {
      setBiometricsEnabled(val === 'true');
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (!isAuthenticated || !biometricsEnabled) return;

    // "inactive" happens on iOS when the app switcher is opened or a call comes in.
    // "background" happens when they switch apps entirely.
    if (nextAppState === 'inactive' || nextAppState === 'background') {
      dispatch(lockApp());
    } 
    else if (nextAppState === 'active' && isAppLocked) {
      handleUnlock();
    }
  };

  const handleUnlock = async () => {
    const success = await promptBiometrics('Unlock QuickSave Vault');
    if (success) {
      dispatch(unlockApp());
    }
  };

  // If the app is not locked, or the user isn't logged in, don't render anything!
  if (!isAppLocked || !isAuthenticated || !biometricsEnabled) return null;

  // The Privacy Shield UI
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={[styles.iconGlow, { backgroundColor: theme.primary + '20' }]}>
        <MaterialCommunityIcons name="shield-lock" size={60} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>QuickSave Locked</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Authenticate to view your financial data.
      </Text>

      <TouchableOpacity 
        style={[styles.unlockButton, { backgroundColor: theme.primary }]}
        onPress={handleUnlock}
      >
        <MaterialCommunityIcons name="face-recognition" size={20} color="#111" />
        <Text style={styles.buttonText}>Unlock App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // Fills the entire screen
    zIndex: 99999, // Sits above literally everything
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconGlow: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  unlockButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 28, gap: 8 },
  buttonText: { color: '#111', fontSize: 16, fontWeight: 'bold' }
});