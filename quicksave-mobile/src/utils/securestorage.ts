import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Strict hardware security options
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // iOS: Token is only accessible when the device is unlocked.
  // It will NOT be backed up to iCloud or transferred to a new device.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const SecureVault = {
  // --- TOKENS ---
  async saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync('accessToken', accessToken, SECURE_OPTIONS);
    await SecureStore.setItemAsync('refreshToken', refreshToken, SECURE_OPTIONS);
  },

  async getAccessToken() {
    return await SecureStore.getItemAsync('accessToken');
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync('refreshToken');
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  // --- BIOMETRICS PREFERENCE ---
  async setBiometricPreference(enabled: boolean) {
    await SecureStore.setItemAsync('biometricsEnabled', enabled ? 'true' : 'false', SECURE_OPTIONS);
  },

  async getBiometricPreference() {
    const value = await SecureStore.getItemAsync('biometricsEnabled');
    return value === 'true'; // Automatically parses to a boolean for you!
  },
};
