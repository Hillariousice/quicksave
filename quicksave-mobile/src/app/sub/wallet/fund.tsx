import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, 
  useColorScheme, ScrollView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { UserService } from '@/api/services/user.service';
import { WalletService } from '@/api/services/wallet.service';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function FundWalletScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // States
  const [amount, setAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK'>('CARD');
  const [loading, setLoading] = useState(false);
  const [savedBank, setSavedBank] = useState<any>(null);
  const [fetchingBank, setFetchingBank] = useState(false);

  // Fetch saved bank account on mount
  useEffect(() => {
    const getBank = async () => {
      setFetchingBank(true);
      try {
        const banks = await UserService.getBanks();
        if (banks && banks.length > 0) {
          setSavedBank(banks.find((b: any) => b.isDefault) || banks[0]);
        }
      } catch (e) {
        console.error("Error fetching banks:", e);
      } finally {
        setFetchingBank(false);
      }
    };
    getBank();
  }, []);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val.replace(/[^0-9]/g, '')) : val;
    return new Intl.NumberFormat('en-NG').format(num);
  };

  const handleFundWallet = async () => {
    const numericAmount = Number(amount.replace(/[^0-9]/g, ''));
    
    if (numericAmount < 100) {
      Alert.alert("Invalid Amount", "Minimum funding amount is ₦100");
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'CARD') {
        // Standard Paystack Web Flow
        const response = await api.post('/wallets/fund', { amount: numericAmount });
        const { authorization_url } = response.data.data;
        await WebBrowser.openBrowserAsync(authorization_url);
        Alert.alert('Processing', 'Your wallet will update shortly once the payment is confirmed.');
        router.back();
      } else {
        // Bank Transfer Flow
        // Most Nigerian apps show account details for manual transfer or use Paystack "Pay with Bank"
        // Here we simulate initiating a bank-direct charge or simply providing transfer details
        Alert.alert(
          "Bank Transfer", 
          `Please transfer ₦${formatCurrency(numericAmount)} to the virtual account provided in your profile or use the Paystack portal.`,
          [{ text: "Use Portal", onPress: () => initiateBankPortal(numericAmount) }, { text: "Cancel", style: "cancel" }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  const initiateBankPortal = async (numericAmount: number) => {
    try {
      const response = await api.post('/wallets/fund', { amount: numericAmount, method: 'bank_transfer' });
      const { authorization_url } = response.data.data;
      await WebBrowser.openBrowserAsync(authorization_url);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not open bank portal.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Fund Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={[styles.questionText, { color: theme.textSecondary }]}>
            How much do you want to add?
          </Text>

          {/* INPUT AMOUNT */}
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
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
                  ]}
                  onPress={() => setAmount(val.toString())}
                >
                  <Text style={[styles.quickPillText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
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
              style={[styles.methodTab, paymentMethod === 'CARD' && { backgroundColor: theme.background, elevation: 2 }]}
              onPress={() => setPaymentMethod('CARD')}
            >
              <Feather name="credit-card" size={16} color={paymentMethod === 'CARD' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.methodText, { color: paymentMethod === 'CARD' ? theme.text : theme.textSecondary }]}>Card</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.methodTab, paymentMethod === 'BANK' && { backgroundColor: theme.background, elevation: 2 }]}
              onPress={() => setPaymentMethod('BANK')}
            >
              <FontAwesome5 name="university" size={14} color={paymentMethod === 'BANK' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.methodText, { color: paymentMethod === 'BANK' ? theme.text : theme.textSecondary }]}>Bank</Text>
            </TouchableOpacity>
          </View>

          {/* SHOW SAVED BANK DETAILS IF BANK METHOD SELECTED */}
          {paymentMethod === 'BANK' && (
            <View style={[styles.savedBankCard, { backgroundColor: theme.inputBg }]}>
               <Text style={styles.infoLabel}>FUNDING FROM SAVED ACCOUNT</Text>
               {fetchingBank ? (
                 <ActivityIndicator size="small" color={theme.primary} />
               ) : savedBank ? (
                 <View style={styles.bankDetailRow}>
                    <MaterialCommunityIcons name="bank-check" size={24} color={theme.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.bankName, { color: theme.text }]}>{savedBank.bankName}</Text>
                      <Text style={{ color: theme.textSecondary }}>{savedBank.accountNumber} • {savedBank.accountName}</Text>
                    </View>
                 </View>
               ) : (
                 <TouchableOpacity onPress={() => router.push('/sub/profile/banks')}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>+ Add bank account in Profile</Text>
                 </TouchableOpacity>
               )}
            </View>
          )}

          {/* SUMMARY */}
          <View style={[styles.summaryCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.summaryRow}>
              <Text style={{ color: theme.textSecondary }}>Transaction Fee</Text>
              <Text style={{ color: theme.textSecondary }}>₦0.00</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total to Pay</Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                ₦{formatCurrency(amount || 0)}
              </Text>
            </View>
          </View>

        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleFundWallet}
            disabled={loading || !amount || Number(amount) <= 0}
          >
            {loading ? <ActivityIndicator color="#111" /> : (
              <View style={styles.btnContent}>
                <Text style={styles.submitButtonText}>Proceed to Fund</Text>
                <Feather name="shield-check" size={18} color="#111" />
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },
  questionText: { textAlign: 'center', fontSize: 14, marginBottom: 16 },
  amountInputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  currencySymbol: { fontSize: 32, fontWeight: 'bold', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
  quickSelectContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32 },
  quickPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickPillText: { fontSize: 13, fontWeight: 'bold' },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  methodContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  methodTab: { flex: 1, flexDirection: 'row', height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, gap: 8 },
  methodText: { fontSize: 14, fontWeight: '600' },
  savedBankCard: { padding: 16, borderRadius: 16, marginBottom: 24 },
  infoLabel: { fontSize: 9, fontWeight: 'bold', color: '#9BA1A6', marginBottom: 12, letterSpacing: 0.5 },
  bankDetailRow: { flexDirection: 'row', alignItems: 'center' },
  bankName: { fontSize: 15, fontWeight: 'bold' },
  summaryCard: { borderRadius: 16, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});