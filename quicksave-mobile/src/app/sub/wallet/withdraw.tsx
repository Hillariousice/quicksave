import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, 
  useColorScheme, ScrollView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { useAppDispatch } from '@/store';
import { fetchWalletData } from '@/store/slices/walletSlice';

export default function WithdrawScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useAppDispatch();

  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const PROCESSING_FEE = 20;

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get('/wallets');
        setWalletBalance(res.data?.data?.balance || 0);
      } catch (e) {
        setWalletBalance(245000); // Fallback mock
      } finally {
        setFetching(false);
      }
    };
    fetchWallet();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG').format(val);
  };

  const handleMax = () => {
    const maxWithdrawal = walletBalance - PROCESSING_FEE;
    if (maxWithdrawal > 0) setAmount(maxWithdrawal.toString());
  };

  const handleWithdraw = async () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (numericAmount < 500) {
      Alert.alert("Invalid Amount", "Minimum withdrawal is ₦500");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/wallets/withdraw', { /* data */ });
    

    dispatch(fetchWalletData());

      // Route to confirmation screen with the transaction data
      router.replace({
        pathname: '/sub/wallet/confirm-withdraw',
        params: { data: JSON.stringify(response.data.data) }
      });

    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  const amountToReceive = Number(amount) > 0 ? Number(amount) - PROCESSING_FEE : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.text, marginLeft: 16 }]}>Withdraw Funds</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Feather name="bell" size={20} color={theme.textSecondary} style={{ marginRight: 16 }} />
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
              <Feather name="user" size={16} color={theme.primary} />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* FROM SECTION */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FROM</Text>
          <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
            <View style={[styles.walletIconBg, { backgroundColor: theme.primary + '20' }]}>
              <FontAwesome5 name="wallet" size={16} color={theme.primary} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>QS Wallet</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Balance: ₦{fetching ? '...' : formatCurrency(walletBalance)}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>

          {/* AMOUNT INPUT */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary, textAlign: 'center', marginTop: 16 }]}>
            AMOUNT TO WITHDRAW
          </Text>
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: theme.primary }]}>₦</Text>
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
          <TouchableOpacity style={[styles.maxButton, { backgroundColor: theme.inputBg }]} onPress={handleMax}>
            <Text style={[styles.maxText, { color: theme.textSecondary }]}>MAX</Text>
          </TouchableOpacity>

          {/* DESTINATION SECTION */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 32 }]}>DESTINATION</Text>
          <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
            <View style={[styles.bankIconBg, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="bank" size={16} color={theme.text} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Access Bank</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>0012 **** 890</Text>
            </View>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </View>

          {/* SUMMARY CARD */}
          <View style={[styles.summaryCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Processing Fee</Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>₦{formatCurrency(PROCESSING_FEE)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 16 }]}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Amount to Receive</Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>
                ₦{formatCurrency(amountToReceive > 0 ? amountToReceive : 0)}
              </Text>
            </View>
          </View>

        </ScrollView>

        {/* FOOTER BUTTON */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading || !amount ? 0.7 : 1 }]}
            onPress={handleWithdraw}
            disabled={loading || !amount}
          >
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitButtonText}>Withdraw Funds</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },
  
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 20 },
  walletIconBg: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  bankIconBg: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardDetails: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardSubtitle: { fontSize: 12 },

  amountInputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  currencySymbol: { fontSize: 40, fontWeight: 'bold', marginRight: 8 },
  amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },
  maxButton: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  maxText: { fontSize: 12, fontWeight: 'bold' },

  summaryCard: { borderRadius: 16, padding: 20, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalValue: { fontSize: 16, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});