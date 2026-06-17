import * as LocalAuthentication from 'expo-local-authentication';

export const promptBiometrics = async (promptMessage = 'Unlock Ajo'): Promise<boolean> => {
  try {
    // 1. Check if the device has biometric hardware (Face ID / Fingerprint scanner)
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    // 2. Check if the user has actually enrolled their face/fingerprint in their phone settings
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return false;

    // 3. Prompt the user
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN', // Button shown if biometrics fail
      disableDeviceFallback: false, // Allows them to use their phone password if Face ID fails
    });

    return result.success;
  } catch (error) {
    console.error('Biometric Auth Error:', error);
    return false;
  }
};
