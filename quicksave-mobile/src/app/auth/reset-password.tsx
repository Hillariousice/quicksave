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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { AuthService } from '@/api/services/auth.service';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (otp.length < 6 || newPassword.length < 8) {
      Alert.alert('Invalid input', 'Please enter the 6-digit OTP and an 8-character password.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({ email, otp, newPassword });
      Alert.alert('Success', 'Password reset successfully! Please log in.');
      router.replace('/auth/login'); // Send them back to login!
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password.');
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
        <Text style={[styles.title, { color: theme.text }]}>Create New Password</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter the 6-digit code sent to {email}
        </Text>

        <Text style={[styles.label, { color: theme.textSecondary }]}>RESET CODE (OTP)</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, marginBottom: 20 }]}>
          <Feather name="key" size={18} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="123456"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>NEW PASSWORD</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
          <Feather name="lock" size={18} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Minimum 8 characters"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPwd}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
            <Feather name={showPwd ? 'eye' : 'eye-off'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
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
