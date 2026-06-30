import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { UserService } from '@/api/services/user.service';

export default function BankAccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulate Paystack Bank Account Resolution
  const handleVerifyAccount = async (text: string) => {
  setAccountNumber(text);
  if (text.length === 10) {
    setLoading(true);
    try {
      // We call the backend, which calls Paystack
      const res = await UserService.addBank({
        bankName: 'GTBank', 
        bankCode: '058', 
        accountNumber: text 
      });
      setResolvedName(res.accountName);
    } catch (e: any) {
      alert(e.response?.data?.message || "Could not resolve account");
    } finally {
      setLoading(false);
    }
  }
};

const handleSave = async () => {
  if (!resolvedName) return;
  setLoading(true);
  try {
    await UserService.addBank({
      accountName: resolvedName,
      accountNumber,
      bankCode: '058',
      bankName: 'GTBank'
    });
    alert('Bank account added successfully!');
    router.back();
  } catch (e) {
    alert('Failed to save bank account');
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Bank Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Add your bank account for payouts</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your details below to receive funds directly.</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Bank Name</Text>
            <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.inputText, { color: theme.text }]}>GTBank</Text>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Account Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.inputText, { color: theme.text, flex: 1 }]}
                placeholder="0123456789"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={10}
                value={accountNumber}
                onChangeText={handleVerifyAccount}
              />
              {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>
          </View>

          {/* Resolved Name Preview */}
          {resolvedName && (
            <View style={styles.resolvedContainer}>
              <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
              <Text style={[styles.resolvedText, { color: theme.primary }]}>{resolvedName}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: resolvedName ? 1 : 0.5 }]}
            disabled={!resolvedName}
            onPress={handleSave}
          >
            <Text style={styles.primaryButtonText}>Save Bank Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles at the bottom of the file
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