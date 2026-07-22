import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const promptBiometrics = async (promptMessage = 'Unlock Ajo'): Promise<boolean> => {
  try {
    // 1. Check if the device has biometric hardware (Face ID / Fingerprint scanner)
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    // 2. Check if the user has actually enrolled their face/fingerprint in their phone settings
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return false;

    // 3. Detect Android-specific hardware types for better UX
    let androidPrompt = promptMessage;
    if (Platform.OS === 'android') {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        androidPrompt = 'Scan Iris to Unlock';
      } else if (
        supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ) {
        androidPrompt = 'Verify Face to Unlock';
      } else {
        androidPrompt = 'Verify Fingerprint to Unlock';
      }
    }
    // 4. Prompt the user
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: Platform.OS === 'android' ? androidPrompt : promptMessage,

      // 👉 Android specific: What the cancel button should say
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN', // Button shown if biometrics fail
      disableDeviceFallback: false, // Allows them to use their phone password if Face ID fails
    });

    return result.success;
  } catch (error) {
    console.error('Biometric Auth Error:', error);
    return false;
  }
};
