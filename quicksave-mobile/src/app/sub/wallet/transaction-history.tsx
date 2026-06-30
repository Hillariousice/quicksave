import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, ActivityIndicator, useColorScheme, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { io } from 'socket.io-client';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { WalletService } from '@/api/services/wallet.service';


// The filters matching your Figma design
const FILTERS = ['All', 'Contributions', 'Payouts', 'Top-ups', 'Withdrawals'];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [activeFilter, setActiveFilter] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 1. Fetch Transactions
  const fetchTransactions = async (pageNumber = 1, filter = activeFilter) => {
  try {
    setLoadingMore(true);
    // Convert UI labels to Backend Enums
    const typeMap: any = {
      'Contributions': 'CONTRIBUTION',
      'Payouts': 'PAYOUT',
      'Top-ups': 'FUNDING',
      'Withdrawals': 'WITHDRAWAL'
    };
    
    const data = await WalletService.getTransactions(typeMap[filter] || 'All', pageNumber);
    
    if (pageNumber === 1) setTransactions(data);
    else setTransactions(prev => [...prev, ...data]);
    
    setHasMore(data.length === 20); // If we got 20, there's likely a next page
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};

  // Initial Load & Filter Change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, activeFilter);
  }, [activeFilter]);

  // 2. Socket.io Real-Time Updates
  useEffect(() => {
    // Extract base URL without the /api/v1 part for Socket.io
    const socketUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://192.168.1.15:3000';
    const socket = io(socketUrl);

    socket.on('newTransaction', (newTx) => {
      // Instantly pop the new transaction to the top of the list!
      setTransactions(prev => [newTx, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Infinite Scroll Handler
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, activeFilter);
    }
  };

  // 3. Grouping Algorithm (Today, Yesterday, Earlier)
  const groupTransactionsByDate = useCallback(() => {
    const groups: { title: string, data: any[] }[] = [
      { title: 'TODAY', data: [] },
      { title: 'YESTERDAY', data: [] },
      { title: 'EARLIER', data: [] }
    ];

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      if (txDate.toDateString() === today.toDateString()) {
        groups[0].data.push(tx);
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        groups[1].data.push(tx);
      } else {
        groups[2].data.push(tx);
      }
    });

    return groups.filter(g => g.data.length > 0); // Only return groups that have data
  }, [transactions]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('.00', '');
  };

  // Icon config generator based on Figma
  const getIconConfig = (tx: any) => {
    if (tx.type === 'FUNDING') return { icon: 'arrow-up', bg: '#8B5A2B20', color: '#D2B48C' }; // Brownish
    if (tx.type === 'WITHDRAWAL') return { icon: 'university', bg: '#FF3B3015', color: '#FF8C00' };
    if (tx.type === 'CONTRIBUTION') return { icon: 'users', bg: '#FF8C0020', color: '#FF8C00' };
    if (tx.type === 'PAYOUT') return { icon: 'money-bill-wave', bg: '#34C75915', color: '#34C759' };
    return { icon: 'credit-card', bg: '#FF3B3015', color: '#FF6B6B' };
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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>QuickSave</Text>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.inputBg }]}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
        </View>
      </View>

      <Text style={[styles.pageTitle, { color: theme.text }]}>Transaction History</Text>

      {/* FILTER PILLS */}
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            return (
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { backgroundColor: isActive ? theme.primary : theme.inputBg }
                ]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[
                  styles.filterText, 
                  { color: isActive ? '#111' : theme.textSecondary, fontWeight: isActive ? 'bold' : '500' }
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* GROUPED TRANSACTIONS LIST */}
      <FlatList
        data={groupTransactionsByDate()}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} /> : null}
        renderItem={({ item: group }) => (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{group.title}</Text>
            
            {/* The single card containing multiple transactions */}
            <View style={[styles.groupCard, { backgroundColor: theme.inputBg }]}>
              {group.data.map((tx, index) => {
                const isLast = index === group.data.length - 1;
                const isCredit = tx.type === 'FUNDING' || tx.type === 'PAYOUT';
                const { icon, bg, color } = getIconConfig(tx);
                
                // Format Time
                const txTime = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const txDateStr = group.title === 'EARLIER' ? `${new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ` : '';

                return (
                  <View key={tx.id} style={[styles.txRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}>
                    
                    <View style={[styles.txIconBg, { backgroundColor: bg }]}>
                      <FontAwesome5 name={icon} size={16} color={color} />
                    </View>
                    
                    <View style={styles.txDetails}>
                      <Text style={[styles.txDescription, { color: theme.text }]} numberOfLines={1}>
                        {tx.description || tx.type}
                      </Text>
                      <Text style={styles.txTime}>
                        {txDateStr}{txTime}
                      </Text>
                    </View>

                    <Text style={[styles.txAmount, { color: isCredit ? '#D2B48C' : theme.textSecondary }]}>
                      {isCredit ? '+' : '-'} ₦{formatCurrency(tx.amount)}
                    </Text>

                  </View>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// Helper to generate mock data perfectly matching the Figma design
const generateMockData = () => {
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 5);

  return [
    { id: '1', type: 'FUNDING', description: 'Weekly Top-up', amount: 250000, createdAt: now },
    { id: '2', type: 'WITHDRAWAL', description: 'Coffee Shop', amount: 4500, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: '3', type: 'CONTRIBUTION', description: 'Group Contribution', amount: 50000, createdAt: yesterday },
    { id: '4', type: 'WITHDRAWAL', description: 'Grocery Store', amount: 84200, createdAt: new Date(yesterday.getTime() - 4 * 60 * 60 * 1000) },
    { id: '5', type: 'WITHDRAWAL', description: 'Savings Withdrawal', amount: 500000, createdAt: lastWeek },
    { id: '6', type: 'FUNDING', description: 'Salary Deposit', amount: 3200000, createdAt: new Date(lastWeek.getTime() - 24 * 60 * 60 * 1000) },
  ];
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },

  pageTitle: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 24, marginBottom: 20 },

  filtersContainer: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13 },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  
  groupCard: { borderRadius: 16, paddingHorizontal: 16, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  txIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  txDetails: { flex: 1, justifyContent: 'center' },
  txDescription: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  txTime: { fontSize: 12, color: '#9BA1A6' },
  txAmount: { fontSize: 15, fontWeight: '500' },
});