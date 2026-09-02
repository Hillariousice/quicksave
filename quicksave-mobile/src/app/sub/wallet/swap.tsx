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
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWalletData } from '@/store/slices/walletSlice';

export default function SwapScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { balance: balanceNGN } = useAppSelector(state => state.wallet); // NGN Balance
  const [balanceUSDT, setBalanceUSDT] = useState(0.00); // Ideally pulled from Redux too

  const [amountNGN, setAmountNGN] = useState('');
  const [loading, setLoading] = useState(false);

  // Exchange rate: 1 USDT = 1600 NGN
  const EXCHANGE_RATE = 1600; 

  const parsedAmountNGN = Number(amountNGN.replace(/,/g, '')) || 0;
  const equivalentUSDT = (parsedAmountNGN / EXCHANGE_RATE).toFixed(2);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG').format(val);
  };

  const handleSwap = async () => {
    if (parsedAmountNGN < 1600) {
      Alert.alert("Invalid Amount", "Minimum swap amount is ₦1,600 (1 USDT).");
      return;
    }
    if (parsedAmountNGN > balanceNGN) {
      Alert.alert("Insufficient Funds", "You do not have enough Naira to complete this swap.");
      return;
    }

    setLoading(true);

    try {
      // Assuming you built the swap endpoint from the previous Web3 guide
      await api.post('/wallets/swap', { amountNGN: parsedAmountNGN });
      
      Alert.alert("Swap Successful 🎉", `You converted ₦${formatCurrency(parsedAmountNGN)} into ₮${equivalentUSDT}.`);
      
      // Update Redux immediately
      dispatch(fetchWalletData());
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Swap failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Swap Currencies</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="clock" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Protect your savings from inflation by converting Naira to Digital Dollars (USDT).
          </Text>

          {/* YOU PAY (NGN) CARD */}
          <View style={[styles.swapCard, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderWidth: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>YOU PAY</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={amountNGN}
                onChangeText={setAmountNGN}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
              />
              <View style={[styles.currencyBadge, { backgroundColor: theme.background }]}>
                <Image source={{ uri: 'https://flagcdn.com/w40/ng.png' }} style={styles.flag} />
                <Text style={[styles.currencyText, { color: theme.text }]}>NGN</Text>
              </View>
            </View>
            <Text style={[styles.balanceText, { color: theme.textSecondary }]}>
              Balance: ₦{formatCurrency(balanceNGN)}
            </Text>
          </View>

          {/* SWAP ICON (Absolute positioned over the cards) */}
          <View style={styles.swapIconWrapper}>
            <View style={[styles.swapIconContainer, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <MaterialCommunityIcons name="swap-vertical" size={24} color="#111" />
            </View>
          </View>

          {/* YOU GET (USDT) CARD */}
          <View style={[styles.swapCard, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, borderWidth: 1, marginTop: -10 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>YOU RECEIVE</Text>
            <View style={styles.inputRow}>
              <Text style={[styles.amountInput, { color: theme.primary }]} numberOfLines={1}>
                {equivalentUSDT}
              </Text>
              <View style={[styles.currencyBadge, { backgroundColor: theme.background }]}>
                <Image source={{ uri: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }} style={styles.flag} />
                <Text style={[styles.currencyText, { color: theme.text }]}>USDT</Text>
              </View>
            </View>
            <Text style={[styles.balanceText, { color: theme.textSecondary }]}>
              Balance: ₮{balanceUSDT.toFixed(2)}
            </Text>
          </View>

          {/* EXCHANGE RATE INFO */}
          <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Exchange Rate</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>1 USDT = ₦{formatCurrency(EXCHANGE_RATE)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Network Fee</Text>
              <Text style={[styles.infoValue, { color: '#34C759' }]}>Free</Text>
            </View>
          </View>

        </ScrollView>

        {/* FOOTER BUTTON */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading || !amountNGN ? 0.7 : 1 }]}
            onPress={handleSwap}
            disabled={loading || !amountNGN}
          >
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitButtonText}>Confirm Swap</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 24, textAlign: 'center' },

  swapCard: { borderRadius: 20, padding: 20, zIndex: 1 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: 'bold' },
  
  currencyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 8 },
  flag: { width: 20, height: 20, borderRadius: 10 },
  currencyText: { fontSize: 14, fontWeight: 'bold' },
  
  balanceText: { fontSize: 12 },

  swapIconWrapper: { alignItems: 'center', zIndex: 10, height: 0, justifyContent: 'center' },
  swapIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 4 },

  infoCard: { marginTop: 32, padding: 16, borderRadius: 12, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});