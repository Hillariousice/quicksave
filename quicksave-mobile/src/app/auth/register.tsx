import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    pin: '',
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    // 👉 1. CLIENT-SIDE VALIDATION (Stops the flicker before it even hits the backend!)
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.pin) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (formData.pin.length !== 4) {
      setErrorMsg('Transaction PIN must be exactly 4 digits.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // 2. Hit the backend API
      await api.post('/auth/register', formData);

      // 3. If successful, route to Verify OTP
      router.replace({
        pathname: '/auth/verify', // Double-check this path matches your folder structure!
        params: { email: formData.email },
      });

    } catch (error: any) {
      console.error('Registration Error Object:', error);
      
      // 4. Read Zod Errors, Backend Errors, and Network Errors!
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        // Catch Zod validation errors (e.g., "Invalid email format")
        setErrorMsg(error.response.data.errors[0].message);
      } else if (error.response?.data?.message) {
        // Catch standard backend errors (e.g., "Email already exists")
        setErrorMsg(error.response.data.message);
      } else if (error.message === 'Network Error') {
        setErrorMsg('Cannot connect to server. Check your internet connection.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Branding */}
          <View style={styles.branding}>
            <FontAwesome5 name="shield-alt" size={18} color={theme.primary} />
            <Text style={[styles.brandText, { color: theme.primary }]}>QUICKSAVE</Text>
          </View>

          {/* Titles */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Create an account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join Quicksave to start pooling money securely.
            </Text>
          </View>

          {/* Error Message Display */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* First & Last Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, flex: 1 }]}>
                <Feather
                  name="user"
                  size={18}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="First Name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.firstName}
                  onChangeText={(val) => handleChange('firstName', val)}
                />
              </View>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, flex: 1 }]}>
                <Feather
                  name="user"
                  size={18}
                  color={theme.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Last Name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.lastName}
                  onChangeText={(val) => handleChange('lastName', val)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="mail" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(val) => handleChange('email', val)}
              />
            </View>

            {/* Phone Number */}
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather
                name="smartphone"
                size={18}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(val) => handleChange('phone', val)}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="lock" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(val) => handleChange('password', val)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* 4-Digit Transaction PIN */}
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="key" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Create 4-Digit PIN"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={formData.pin}
                onChangeText={(val) => handleChange('pin', val)}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 40 : 30 }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            {/* Navigates back to the Login screen */}
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  branding: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 50 },
  brandText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14 },
  form: { gap: 16, marginBottom: 40 },
  row: { flexDirection: 'row', gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  button: {
    height: 56,
    borderRadius: 28, // Fully rounded like the Figma design
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
  errorBox: { backgroundColor: '#FF3B3020', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontSize: 14, fontWeight: '500' },
});
