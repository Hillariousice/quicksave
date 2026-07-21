import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  useColorScheme, SafeAreaView, ActivityIndicator, Alert,
  KeyboardAvoidingView, ScrollView, Platform, Keyboard 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { useDispatch } from 'react-redux';
import { verifyOtpAction } from '@/store/slices/authSlice';
import { api } from '@/api/client';
import { useCountdown } from '@/hooks/use-countdown';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  // --- TIMER STATE ---
 const { second, formatTime, isFinished, resetTimer } = useCountdown(60);

  const inputRefs = useRef<Array<TextInput | null>>([]);


  const handleResend = async () => {
    if (!isFinished) return;
    
    setLoading(true);
    try {
      // Call your backend to resend the OTP
      await api.post('/auth/resend-otp', { email });
       resetTimer(60);  // Reset timer
      setCanResend(false);
      Alert.alert("Success", "A new code has been sent to your email.");
    } catch (err: any) {
      Alert.alert("Error", "Failed to resend code. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // --- OTP INPUT LOGIC ---
  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert("Error", "Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await dispatch(verifyOtpAction({ email: email as string, otp: otpString })).unwrap();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert("Verification Failed", err || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value !== '') Keyboard.dismiss();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Verification</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.centerIcon}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                <FontAwesome5 name="shield-alt" size={30} color={theme.primary} />
              </View>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Check your phone</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter the 6-digit code sent to {email}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpBox, { backgroundColor: theme.inputBg, borderColor: digit ? theme.primary : theme.inputBorder, color: theme.text }]}
                  onChangeText={(val) => updateOtp(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                />
              ))}
            </View>

            {/* --- UPDATED TIMER UI --- */}
            <View style={styles.timerContainer}>
              <FontAwesome5 name="clock" size={14} color={isFinished > 0 ? theme.primary : theme.textSecondary} />
              <Text style={[styles.timerText, { color: isFinished > 0 ? theme.primary : theme.textSecondary }]}>
                {formatTime()}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleResend} 
              disabled={!isFinished}
              style={[styles.resendBtn, { opacity: seconds ? 1 : 0.5 }]}
            >
              <Text style={[styles.resendText, { color: seconds ? theme.primary : theme.textSecondary }]}>
                RESEND CODE
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]} 
              onPress={handleVerify} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Verify 🛡️</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  centerIcon: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpBox: { width: 45, height: 55, borderWidth: 1, borderRadius: 8, fontSize: 22, textAlign: 'center', fontWeight: 'bold' },
  timerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 10 },
  timerText: { fontSize: 16, fontWeight: '600' },
  resendBtn: { alignSelf: 'center', padding: 10 },
  resendText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  footer: { paddingHorizontal: 24, marginTop: 40, paddingBottom: 20 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});