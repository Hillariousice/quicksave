import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  useColorScheme, SafeAreaView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/theme/Colors';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Optional: Auto-skip if the device physically doesn't have a scanner
  useEffect(() => {
    const checkHardware = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        handleSkip();
      }
    };
    checkHardware();
  }, []);

  const handleEnableBiometrics = async () => {
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!isEnrolled) {
      Alert.alert(
        'Not Enrolled', 
        'No biometrics are set up on this device. Please set them up in your phone settings.'
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable Biometric Login for Quicksave',
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      // ⭐️ Persist the preference securely!
      await SecureStore.setItemAsync('biometricsEnabled', 'true');
      router.replace('/(tabs)'); // Send them to the dashboard!
    } else {
      Alert.alert('Authentication Failed', 'We could not verify your biometrics. Try again or skip.');
    }
  };

  const handleSkip = async () => {
    // Save that they actively chose to skip, so we don't ask again next time
    await SecureStore.setItemAsync('biometricsEnabled', 'false');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.branding}>
          <FontAwesome5 name="shield-alt" size={18} color={theme.primary} />
          <Text style={[styles.brandText, { color: theme.primary }]}>QUICKSAVE</Text>
        </View>
        <TouchableOpacity>
          <Feather name="help-circle" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        
        {/* The Inner Card */}
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          
          {/* Glowing Fingerprint Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconGlow, { borderColor: theme.primary + '40' }]}>
              <MaterialCommunityIcons name="fingerprint" size={50} color={theme.primary} />
            </View>
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: theme.text }]}>
            Enable Face ID /{"\n"}Fingerprint
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Log in faster and more securely{"\n"}with your device's biometric{"\n"}authentication.
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleEnableBiometrics}
          >
            <Text style={styles.primaryButtonText}>Enable Biometrics</Text>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#111" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.skipButton, { borderColor: theme.inputBorder }]}
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>

          {/* Footer Security Text */}
          <View style={styles.securityFooter}>
            <Feather name="lock" size={12} color={theme.textSecondary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Secured by Quicksave Vault Technology
            </Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 20 
  },
  branding: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20 
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: { marginBottom: 30 },
  iconGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C0010', // Extremely faint orange background
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 12,
    lineHeight: 30,
  },
  subtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 32 
  },
  primaryButton: { 
    flexDirection: 'row',
    width: '100%', 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  skipButton: { 
    width: '100%', 
    height: 56, 
    borderRadius: 28, 
    borderWidth: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 30
  },
  skipButtonText: { fontSize: 16, fontWeight: '600' },
  securityFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securityText: { fontSize: 11, fontWeight: '500' },
});