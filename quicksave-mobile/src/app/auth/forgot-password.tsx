import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { AuthService } from '@/api/services/auth.service';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      // Pass the email to the next screen so they don't have to retype it!
      router.push({ pathname: '/auth/reset-password', params: { email } });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlow, { backgroundColor: theme.primary + '15' }]}>
            <Feather name="lock" size={32} color={theme.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </Text>

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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary, opacity: loading || !email ? 0.7 : 1 },
          ]}
          onPress={handleRequestReset}
          disabled={loading || !email}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  iconWrapper: { alignItems: 'center', marginBottom: 24 },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  button: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});
