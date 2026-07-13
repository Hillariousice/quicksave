import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { useAppSelector } from '@/store';

export default function TwoFactorSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAppSelector((state) => state.auth.user);

  const [method, setMethod] = useState<'APP' | 'SMS'>('APP');

  const sendSmsCode = async ({phone}: {phone: string})=> {
     try{
      
      const res = await api.post('/auth/send-sms-code', { phone });
      console.log(res.data);
      setMethod('SMS')
     }catch(e){
      console.log(e);
     }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>2FA Security</Text>
        <FontAwesome5 name="shield-alt" size={18} color={theme.textSecondary} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlow, { backgroundColor: theme.primary + '20' }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color={theme.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Secure Your Account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Add an extra layer of protection to your financial vault and transactions.
        </Text>

        {/* AUTHENTICATOR APP OPTION */}
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.inputBg, borderColor: method === 'APP' ? theme.primary : theme.inputBg }]}
          onPress={() => setMethod('APP')}
        >
          <MaterialCommunityIcons name="dialpad" size={24} color={theme.textSecondary} style={styles.optionIcon} />
          <View style={styles.optionTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Authenticator App</Text>
              <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>RECOMMENDED</Text></View>
            </View>
            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>Use apps like Google Authenticator or Authy to generate secure, offline codes.</Text>
          </View>
          <View style={[styles.radio, method === 'APP' && { borderColor: theme.primary }]}>
            {method === 'APP' && <View style={[styles.radioFill, { backgroundColor: theme.primary }]} />}
          </View>
        </TouchableOpacity>

        {/* SMS OPTION */}
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: theme.inputBg, borderColor: method === 'SMS' ? theme.primary : theme.inputBg }]}
          onPress={() => sendSmsCode(user.phone)}
        >
          <MaterialCommunityIcons name="message-processing-outline" size={24} color={theme.textSecondary} style={styles.optionIcon} />
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>SMS Verification</Text>
            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>Receive a unique one-time code via text message to your registered mobile number.</Text>
          </View>
          <View style={[styles.radio, method === 'SMS' && { borderColor: theme.primary }]}>
            {method === 'SMS' && <View style={[styles.radioFill, { backgroundColor: theme.primary }]} />}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          // 👉 Pushes to the verification screen!
          onPress={() => router.push('/sub/profile/verify-twofa')}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
          <Feather name="chevron-right" size={18} color="#111" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Learn more about 2FA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30, alignItems: 'center' },
  iconWrapper: { marginBottom: 20 },
  iconGlow: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 10 },
  
  optionCard: { flexDirection: 'row', width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  optionIcon: { marginRight: 16 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  recommendedBadge: { backgroundColor: '#FF8C0020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recommendedText: { color: '#FF8C00', fontSize: 8, fontWeight: 'bold' },
  optionDesc: { fontSize: 12, lineHeight: 18 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 10, height: 10, borderRadius: 5 },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  otpBox: { width: 45, height: 55, borderWidth: 1, borderRadius: 8, fontSize: 20, textAlign: 'center', fontWeight: 'bold' },
  timerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 16 },
  timerText: { fontSize: 13 },
  resendText: { fontSize: 13, fontWeight: '600' },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  securityNote: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
});