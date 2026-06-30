import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { AuthService } from '@/api/services/auth.service';


export default function ChangePasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading,setLoading] = useState(false)
  const [errorMsg,setErrorMsg] = useState('');

  // Dynamic Validation Logic
  const hasMinLength = newPwd.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPwd);
  const hasNumber = /\d/.test(newPwd);
  const isValid = hasMinLength && hasSpecialChar && hasNumber && newPwd === confirmPwd;
const handleUpdatePassword = async () => {
    try {
        setLoading(true);
        await AuthService.changePassword({
            oldPassword: currentPwd,
            newPassword: newPwd
        });
        alert('Success: Password changed');
        router.back();
    } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to update');
    } finally {
        setLoading(false);
    }
};

  const CheckItem = ({ valid, text }: any) => (
    <View style={styles.checkItem}>
      <Feather name="check-circle" size={16} color={valid ? theme.primary : theme.textSecondary} />
      <Text style={[styles.checkText, { color: valid ? theme.text : theme.textSecondary }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Change Password</Text>
          <FontAwesome5 name="shield-alt" size={18} color={theme.textSecondary} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Secure Your Vault</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your current password and choose a strong new one to keep your account secure.</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Current Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput style={[styles.input, { color: theme.text }]} secureTextEntry={!showPwd} value={currentPwd} onChangeText={setCurrentPwd} />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)}><Feather name={showPwd ? "eye" : "eye-off"} size={18} color={theme.textSecondary} /></TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>New Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput style={[styles.input, { color: theme.text }]} secureTextEntry={!showPwd} value={newPwd} onChangeText={setNewPwd} placeholder="Create a strong password" placeholderTextColor={theme.textSecondary} />
          </View>

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>Confirm New Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput style={[styles.input, { color: theme.text }]} secureTextEntry={!showPwd} value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Re-enter your new password" placeholderTextColor={theme.textSecondary} />
          </View>

          <View style={styles.requirementsBox}>
            <Text style={[styles.reqTitle, { color: theme.textSecondary }]}>REQUIREMENTS</Text>
            <CheckItem valid={hasMinLength} text="Minimum 8 characters" />
            <CheckItem valid={hasSpecialChar} text="One special character (!@#$)" />
            <CheckItem valid={hasNumber} text="One numerical digit" />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: isValid ? 1 : 0.5 }]} disabled={!isValid} onPress={handleUpdatePassword}>
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  inputText: { flex: 1, fontSize: 16, fontWeight: '500' },
  input: { flex: 1, fontSize: 16 },
  
  resolvedContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resolvedText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  card: { borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 24 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightText: { fontSize: 12 },
  divider: { height: 1, backgroundColor: '#333', opacity: 0.5 },
  
  dangerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  dangerText: { color: '#FF3B30', fontSize: 15, fontWeight: 'bold' },
  dangerHint: { textAlign: 'center', fontSize: 11, marginTop: 12, paddingHorizontal: 20 },

  requirementsBox: { marginTop: 24 },
  reqTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkText: { fontSize: 13 },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});