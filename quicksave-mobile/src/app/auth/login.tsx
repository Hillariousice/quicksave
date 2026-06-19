import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  useColorScheme, SafeAreaView, KeyboardAvoidingView, 
  Platform, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { setCredentials } from '@/store/slices/authSlice';
import { promptBiometrics } from '@/utils/biometrics';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Hit your Express Backend
      const response = await api.post('/auth/login', { email, password });
      console.log('Login Response:', response.data);
      const { user, tokens } = response.data.data;
       

      // Save tokens securely to the hardware vault
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

      // 3. Update Redux global state
      dispatch(setCredentials({ user }));
      const biometricPreference = await SecureStore.getItemAsync('biometricsEnabled');
      // 4. Route to the Dashboard (using replace so they can't swipe back to login)
       if (!biometricPreference) {
        // If null, they haven't seen the setup screen yet! Send them there.
        router.replace('/auth/biometrics'); 
      } else {
        // If 'true' or 'false', they already made a choice. Go straight to Home.
        router.replace('/(tabs)'); 
      }

    } catch (error: any) {
      console.error('Login Error Object:', error);
      // const message = error.response?.data?.message || 'Invalid credentials. Please try again.';
      // setErrorMsg(message);

       if (error.response) {
      // Server responded with 4xx or 5xx
      const message = error.response.data?.message || 'Invalid credentials.';
      setErrorMsg(message);
    } else if (error.request) {
      // Request was made but no response received (Network Error)
      setErrorMsg('Cannot connect to server. Check your Wi-Fi/IP.');
    } else {
      setErrorMsg('An unexpected error occurred.');
    }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    // If you saved a token previously, you can use FaceID/Fingerprint to unlock the app instantly!
    const success = await promptBiometrics('Unlock Quicksave');
    if (success) {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Just bypass login if they already have a valid token stored
        router.replace('/(tabs)');
      } else {
        setErrorMsg('Please log in with your password first.');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        
        {/* Top Branding matching your Figma */}
        <View style={styles.branding}>
          <FontAwesome5 name="shield-alt" size={18} color={theme.primary} />
          <Text style={[styles.brandText, { color: theme.primary }]}>QUICKSAVE</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Securely access your Quicksave vault.
          </Text>
        </View>

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <Feather name="mail" size={18} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <Feather name="lock" size={18} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Biometrics Button */}
        <View style={styles.biometricContainer}>
          <TouchableOpacity 
            style={[styles.biometricButton, { backgroundColor: theme.inputBg }]}
            onPress={handleBiometricLogin}
          >
            <MaterialIcons name="fingerprint" size={28} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Register</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  branding: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 60 },
  brandText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14 },
  form: { gap: 16, marginBottom: 30 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56, 
    borderRadius: 12, 
    paddingHorizontal: 16 
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  biometricContainer: { alignItems: 'center', marginBottom: 20 },
  biometricButton: { 
    width: 60, height: 60, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center' 
  },
  forgotPassword: { alignItems: 'center', marginBottom: 30 },
  forgotText: { fontSize: 14, fontWeight: '600' },
  button: { 
    height: 56, borderRadius: 28, 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 24 
  },
  buttonText: { color: '#11181C', fontSize: 16, fontWeight: 'bold' }, // Dark text on orange button
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 30 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
  errorBox: { backgroundColor: '#FF3B3020', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontSize: 14, fontWeight: '500' },
});