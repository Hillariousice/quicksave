import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, ActivityIndicator, useColorScheme, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { io } from 'socket.io-client';

import { Colors } from '@/theme/Colors';
import { WalletService } from '@/api/services/wallet.service';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import TransactionCard from '@/components/card/transaction-card';
import { useAppSelector } from '@/store';
import OptimizedList from '@/components/ui/optimed-list';
import TransactionGroupCard from '@/components/card/transaction-group-card';
import { socketService } from '@/api/services/socket.service';

// The filters matching your Figma design
const FILTERS = ['All', 'Contributions', 'Payouts', 'Top-ups', 'Withdrawals'];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [activeFilter, setActiveFilter] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Use useCallback so function references don't change
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('.00', '');
  }, []);

  const fetchTransactions = async (pageNumber = 1, filter = activeFilter) => {
    try {
      setLoadingMore(true);
      const typeMap: any = { 'Contributions': 'CONTRIBUTION', 'Payouts': 'PAYOUT', 'Top-ups': 'FUNDING', 'Withdrawals': 'WITHDRAWAL' };
      const data = await WalletService.getTransactions(typeMap[filter] || 'All', pageNumber);
      
      if (pageNumber === 1) setTransactions(data);
      else setTransactions(prev => [...prev, ...data]);
      
      setHasMore(data.length === 20); 
    } catch (error) {
      console.error(error);
      if (pageNumber === 1) setTransactions(generateMockData()); // Fallback
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, activeFilter);
  }, [activeFilter]);

  // SOCKET LOGIC
 useEffect(() => {
    // 1. Define the callback
    const handleNewTx = (newTx: any) => {
      setTransactions(prev => [newTx, ...prev]);
    };

    // 2. Attach the listener to our Singleton service (No new connections created!)
    socketService.onNewTransaction(handleNewTx);

    // 3. ⭐️ The Cleanup Function!
    // When the user leaves this screen, React Native fires this return function. 
    // It detaches the listener so it doesn't continue running in the background and leaking memory.
    return () => {
      socketService.offNewTransaction(handleNewTx);
    };
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, activeFilter);
    }
  };

  // Grouping Algorithm
  const groupTransactionsByDate = useCallback(() => {
    const groups: { title: string, data: any[] }[] = [
      { title: 'TODAY', data: [] }, { title: 'YESTERDAY', data: [] }, { title: 'EARLIER', data: [] }
    ];
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      if (txDate.toDateString() === today.toDateString()) groups[0].data.push(tx);
      else if (txDate.toDateString() === yesterday.toDateString()) groups[1].data.push(tx);
      else groups[2].data.push(tx);
    });
    return groups.filter(g => g.data.length > 0);
  }, [transactions]);

  // 👉 The Memoized Render Item!
  const renderItem = useCallback(({ item }: any) => {
    return (
      <TransactionGroupCard 
        group={item} 
        theme={theme} 
        formatCurrency={formatCurrency} 
        colorScheme={colorScheme} 
      />
    );
  }, [theme, colorScheme, formatCurrency]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.header}><Text style={[styles.pageTitle, { color: theme.text }]}>Transaction History</Text></View>
        <SkeletonLoader count={6} />
      </SafeAreaView>
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
                style={[styles.filterPill, { backgroundColor: isActive ? theme.primary : theme.inputBg }]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.filterText, { color: isActive ? '#111' : theme.textSecondary, fontWeight: isActive ? 'bold' : '500' }]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

     
      <OptimizedList
        data={groupTransactionsByDate()}
        keyExtractor={(item: any) => item.title}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        // No need for getItemLayout here since the dynamic array grouping makes heights wildly variable
        renderItem={renderItem}
      />
    </SafeAreaView>
  );}

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