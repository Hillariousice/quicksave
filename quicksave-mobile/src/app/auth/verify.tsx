import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function VerifyScreen() {
  const router = useRouter();
 const colorScheme = useColorScheme();
const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [code, setCode] = useState(['', '', '', '', '', '']); // 6 digit OTP

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Verification</Text>
        </TouchableOpacity>
        <FontAwesome5 name="shield-alt" size={20} color={theme.primary} />
      </View>

      <View style={styles.content}>
        {/* Icon & Titles */}
        <View style={styles.centerIcon}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <FontAwesome5 name="shield-alt" size={30} color={theme.primary} />
          </View>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Check your phone</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter the 6-digit code sent to +234 XXX
        </Text>

        {/* 6-Digit OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpBox, 
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              // Note: In a real app, use a ref to auto-focus the next input!
            />
          ))}
        </View>

        {/* Resend Timer */}
        <View style={styles.timerContainer}>
          <FontAwesome5 name="clock" size={14} color={theme.primary} />
          <Text style={[styles.timerText, { color: theme.primary }]}>00:57</Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>RESEND CODE</Text>
        </TouchableOpacity>

        {/* Footer Area */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]}>
            <Text style={styles.buttonText}>Verify 🛡️</Text>
          </TouchableOpacity>
          
          <Text style={[styles.supportText, { color: theme.textSecondary }]}>
            Having trouble? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Contact Support</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  centerIcon: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpBox: { width: 45, height: 55, borderWidth: 1, borderRadius: 8, fontSize: 20, textAlign: 'center', fontWeight: 'bold' },
  timerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 10 },
  timerText: { fontSize: 16, fontWeight: '600' },
  resendText: { textAlign: 'center', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  footer: { marginTop: 'auto', marginBottom: 20 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  supportText: { textAlign: 'center', fontSize: 14 },
});