import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, 
  useColorScheme, ScrollView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function FundWalletScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [amount, setAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK'>('CARD');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG').format(val);
  };

  const handleFundWallet = async () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (numericAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum funding amount is ₦100");
      return;
    }

    setLoading(true);

    try {
      // 1. endpoint to get the Paystack Checkout URL
      const response = await api.post('/wallets/fund', { amount: numericAmount });
      const { authorization_url, reference } = response.data.data;

      // 2. Open the Paystack checkout securely IN the app!
      const result = await WebBrowser.openBrowserAsync(authorization_url);

      // 3. When they close the browser, we assume the webhook (Day 23) handles the rest!
      // In a real app, you might poll the backend here to verify, but we can just go back to the wallet.
      Alert.alert('Processing', 'If your payment was successful, your wallet will update shortly.');
      router.back();

    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Fund Wallet</Text>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
            <Feather name="user" size={16} color={theme.primary} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={[styles.questionText, { color: theme.textSecondary }]}>
            How much do you want to add?
          </Text>

          {/* HUGE AMOUNT INPUT */}
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              maxLength={8}
            />
          </View>

          {/* QUICK SELECT PILLS */}
          <View style={styles.quickSelectContainer}>
            {QUICK_AMOUNTS.map((val) => {
              const isSelected = Number(amount) === val;
              return (
                <TouchableOpacity 
                  key={val}
                  style={[
                    styles.quickPill, 
                    { backgroundColor: theme.inputBg, borderColor: isSelected ? theme.primary : theme.inputBorder },
                    isSelected && styles.quickPillSelected
                  ]}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={[
                    styles.quickPillText, 
                    { color: isSelected ? theme.primary : theme.textSecondary }
                  ]}>
                    ₦{formatCurrency(val)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PAYMENT METHOD TOGGLE */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PAYMENT METHOD</Text>
          <View style={[styles.methodContainer, { backgroundColor: theme.inputBg }]}>
            <TouchableOpacity 
              style={[styles.methodTab, paymentMethod === 'CARD' && { backgroundColor: theme.background }]}
              onPress={() => setPaymentMethod('CARD')}
            >
              <Feather name="credit-card" size={16} color={paymentMethod === 'CARD' ? theme.text : theme.textSecondary} />
              <Text style={[styles.methodText, { color: paymentMethod === 'CARD' ? theme.text : theme.textSecondary }]}>Card</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.methodTab, paymentMethod === 'BANK' && { backgroundColor: theme.background }]}
              onPress={() => setPaymentMethod('BANK')}
            >
              <FontAwesome5 name="university" size={14} color={paymentMethod === 'BANK' ? theme.text : theme.textSecondary} />
              <Text style={[styles.methodText, { color: paymentMethod === 'BANK' ? theme.text : theme.textSecondary }]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>

          {/* SUMMARY CARD */}
          <View style={[styles.summaryCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Fee</Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>₦0.00</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                ₦{formatCurrency(Number(amount) || 0)}
              </Text>
            </View>
          </View>

        </ScrollView>

        {/* FOOTER BUTTON */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleFundWallet}
            disabled={loading || !amount || Number(amount) <= 0}
          >
            {loading ? (
              <ActivityIndicator color="#111" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.submitButtonText}>Fund ₦{formatCurrency(Number(amount) || 0)}</Text>
                <Feather name="arrow-right" size={18} color="#111" />
              </View>
            )}
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
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 100 },

  questionText: { textAlign: 'center', fontSize: 14, marginBottom: 16 },
  
  amountInputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  currencySymbol: { fontSize: 40, fontWeight: 'bold', marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },

  quickSelectContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 40 },
  quickPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  quickPillSelected: { backgroundColor: '#FF8C0015' },
  quickPillText: { fontSize: 14, fontWeight: '600' },

  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  
  methodContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 32 },
  methodTab: { flex: 1, flexDirection: 'row', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, gap: 8 },
  methodText: { fontSize: 14, fontWeight: '600' },

  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalValue: { fontSize: 16, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});