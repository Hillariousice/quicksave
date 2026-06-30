import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, ActivityIndicator, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWalletData } from '@/store/slices/walletSlice';


export default function WalletDashboardScreen() {
  const router = useRouter();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dispatch = useAppDispatch();

  // 👉 2. Pull data directly from Global Redux State!
  const { balance, transactions, isLoading } = useAppSelector((state) => state.wallet);
const { isConnected, isInternetReachable } = useAppSelector((state) => state.network);
const isOffline = isConnected === false || isInternetReachable === false;
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // const [wallet, setWallet] = useState<any>(null);
  // const [transactions, setTransactions] = useState<any[]>([]);

  // Fetch Wallet & Transactions (Hits Day 22 Endpoints)
  useEffect(() => {
    dispatch(fetchWalletData());
  }, [dispatch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('.00', '');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION': return { icon: 'users', bg: theme.inputBg, color: theme.textSecondary };
      case 'FUNDING': return { icon: 'wallet', bg: theme.inputBg, color: theme.textSecondary };
      case 'PAYOUT': return { icon: 'money-bill-wave', bg: theme.inputBg, color: theme.textSecondary };
      case 'WITHDRAWAL': return { icon: 'university', bg: theme.inputBg, color: theme.textSecondary };
      default: return { icon: 'exchange-alt', bg: theme.inputBg, color: theme.textSecondary };
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>QuickSave</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
            <Feather name="user" size={16} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HUGE BALANCE CARD */}
        <View style={[styles.balanceCard, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F9FAFB', borderColor: theme.inputBorder, borderWidth: colorScheme === 'light' ? 1 : 0 }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Feather name={showBalance ? "eye" : "eye-off"} size={18} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.balanceAmount, { color: theme.text }]}>
            {showBalance ? formatCurrency(balance || 0) : '₦ ••••••'}
          </Text>

          <View style={styles.subBalanceRow}>
            <View>
              <Text style={styles.subBalanceLabel}>Available Balance</Text>
              <Text style={[styles.subBalanceValue, { color: theme.text }]}>
                {showBalance ? formatCurrency(balance || 0) : '••••••'}
              </Text>
            </View>
            <View>
              <Text style={styles.subBalanceLabel}>Pending Balance</Text>
              <Text style={[styles.subBalanceValue, { color: theme.text }]}>₦0</Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/sub/wallet/fund')} // 👉 Routes to Fund Wallet!
          >
            <Feather name="plus" size={18} color="#111" />
            <Text style={styles.primaryActionText}>Fund Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
      styles.secondaryAction, 
      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
      isOffline && { opacity: 0.5 } // Visual disabled state
    ]}
    onPress={() => {
      if (isOffline) {
        alert("Withdrawals require an active internet connection.");
        return;
      }
      router.push('/sub/wallet/withdraw');
    }}
          >
            <Feather name="arrow-up" size={18} color={theme.text} />
            <Text style={[styles.secondaryActionText, { color: theme.text }]}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Recent Transactions</Text>
          <TouchableOpacity><Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text></TouchableOpacity>
        </View>

        <View style={styles.transactionsContainer}>
          {transactions.map((tx, index) => {
            const isCredit = tx.type === 'FUNDING' || tx.type === 'PAYOUT';
            const { icon, bg, color } = getTransactionIcon(tx.type);
            const amountColor = isCredit ? '#34C759' : '#FF3B30';
            const sign = isCredit ? '+' : '-';

            return (
              <TouchableOpacity  key={tx.id || index} style={[styles.txCard, { backgroundColor: theme.inputBg }]}  onPress={() => router.push({
            pathname: '/sub/wallet/transaction-receipt',
            params: { id: tx.id } 
          })}>
                <View style={[styles.txIconBg, { backgroundColor: bg }]}>
                  <FontAwesome5 name={icon} size={16} color={color} />
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txDescription, { color: theme.text }]} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: amountColor }]}>
                  {sign}{formatCurrency(tx.amount)}
                </Text>
              </TouchableOpacity >
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 24, marginTop: 10 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { color: '#9BA1A6', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  balanceAmount: { fontSize: 40, fontWeight: 'bold', marginBottom: 24 },
  
  subBalanceRow: { flexDirection: 'row', gap: 40 },
  subBalanceLabel: { color: '#9BA1A6', fontSize: 11, marginBottom: 4, fontWeight: '500' },
  subBalanceValue: { fontSize: 14, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  primaryAction: { flex: 1, flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryActionText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  secondaryAction: { flex: 1, flexDirection: 'row', height: 56, borderRadius: 28, borderWidth: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryActionText: { fontSize: 16, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  seeAll: { fontSize: 14, fontWeight: '600' },

  transactionsContainer: { gap: 12 },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  txIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txDetails: { flex: 1 },
  txDescription: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  txDate: { fontSize: 12, color: '#9BA1A6' },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
});