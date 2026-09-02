import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ActivityIndicator, useColorScheme, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { UserService } from '@/api/services/user.service'; // Or AuthService
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice'; 

// Basic list of Nigerian Banks for the mock UI
const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Guaranty Trust Bank (GTB)', code: '058' },
  { name: 'First Bank', code: '011' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Opay', code: '999992' },
  { name: 'Moniepoint', code: '090405' },
];

export default function KycVerificationModal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState(BANKS[0].code); // Default to Access Bank
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (accountNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit account number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Send Account Details to your new Paystack-backed endpoint
      const res = await UserService.verifyKyc({ accountNumber, bankCode });
      
      // 2. The backend returned the upgraded user object
      const updatedUser = res.data;
      
      // 3. Update Redux instantly!
      dispatch(setCredentials({ user: updatedUser }));

      // 4. Slide the modal down and show success
      Alert.alert('Success 🎉', 'Your identity has been verified.');
      router.back();

    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Please check your bank details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        
        <View style={styles.dragIndicator} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconGlow, { backgroundColor: theme.primary + '20' }]}>
            <MaterialCommunityIcons name="bank-check" size={48} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Verify your Identity</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            To keep Quicksave secure, we need to verify your identity. Please enter a bank account registered in your name.
          </Text>

          {/* BANK SELECTOR */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>SELECT BANK</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, marginBottom: 16 }]}>
            <FontAwesome5 name="university" size={16} color={theme.textSecondary} style={{ marginRight: 12 }} />
            {/* In a real app, use a proper Picker/Dropdown component here */}
            <Text style={{ color: theme.text, flex: 1 }}>{BANKS.find(b => b.code === bankCode)?.name}</Text>
          </View>

          {/* ACCOUNT NUMBER INPUT */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>ACCOUNT NUMBER</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <FontAwesome5 name="hashtag" size={16} color={theme.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="0123456789"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={10}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>
          
          <View style={styles.securityNote}>
            <Feather name="lock" size={12} color={theme.textSecondary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              We use Paystack to securely verify that the name on this bank account matches your Quicksave profile.
            </Text>
          </View>

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading || accountNumber.length < 10 ? 0.6 : 1 }]}
            onPress={handleVerify}
            disabled={loading || accountNumber.length < 10}
          >
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitButtonText}>Verify Identity</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ... styles remain exactly the same as your previous BVN screen ...
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  header: { alignItems: 'flex-end', marginBottom: 20 },
  closeButton: { padding: 5 },
  content: { flex: 1, alignItems: 'center' },
  iconGlow: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16, width: '100%', marginBottom: 16 },
  input: { flex: 1, fontSize: 18, fontWeight: '600', letterSpacing: 2 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '100%', paddingHorizontal: 4, marginTop: 10 },
  securityText: { fontSize: 11, lineHeight: 16, flex: 1 },
  footer: { paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});