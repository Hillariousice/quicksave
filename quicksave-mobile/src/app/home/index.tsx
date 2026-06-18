import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, useColorScheme, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import ActionBtn from '@/components/home/action-btn';
import ActivityItem from '@/components/home/activity-item';
import NavItem from '@/components/home/nav-item';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Global State
  const user = useSelector((state: any) => state.auth.user);

  // Local State
  const [showBalance, setShowBalance] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Hitting the Day 22 Wallet endpoints
        const [walletRes, txRes] = await Promise.all([
          api.get('/wallets'),
          api.get('/wallets/transactions')
        ]);
        
        setWallet(walletRes.data.data);
        setTransactions(txRes.data.data.slice(0, 3)); // Grab only top 3 for recent activity
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
      .format(amount)
      .replace('.00', ''); // Clean up trailing zeros
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning,</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.firstName || 'Hillary'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.avatar} 
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* WALLET BALANCE CARD */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Feather name={showBalance ? "eye" : "eye-off"} size={18} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {showBalance ? formatCurrency(wallet?.balance || 245000) : '₦ ••••••'}
            </Text>
            <Text style={styles.percentage}>+2.4%</Text>
          </View>

          <View style={styles.qsBadge}>
            <FontAwesome5 name="shield-alt" size={12} color={theme.primary} />
            <Text style={styles.qsBadgeText}>QS Wallet</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionsContainer}>
          <ActionBtn icon="arrow-up" label="Contribute" theme={theme} />
          <ActionBtn icon="arrow-down" label="Fund" theme={theme} />
          <ActionBtn icon="external-link" label="Withdraw" theme={theme} />
          <ActionBtn icon="users" label="Invite" theme={theme} />
        </View>

        {/* ACTIVE GROUPS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Groups</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
          {/* Mock Group Card 1 */}
          <View style={[styles.groupCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.groupCardHeader}>
              <FontAwesome5 name="users" size={16} color={theme.textSecondary} />
              <Text style={styles.groupBadge}>Ajo</Text>
            </View>
            <Text style={[styles.groupName, { color: theme.text }]}>Lagos Entrepreneurs</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>Progress</Text>
                <Text style={styles.progressText}>60%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
            </View>
            <Text style={styles.nextDate}>🗓 Next: Oct 15</Text>
          </View>

          {/* Mock Group Card 2 */}
          <View style={[styles.groupCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.groupCardHeader}>
              <FontAwesome5 name="home" size={16} color={theme.textSecondary} />
              <Text style={styles.groupBadge}>Family</Text>
            </View>
            <Text style={[styles.groupName, { color: theme.text }]}>Family Savings</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>Progress</Text>
                <Text style={styles.progressText}>25%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '25%' }]} />
              </View>
            </View>
            <Text style={styles.nextDate}>🗓 Next: Nov 02</Text>
          </View>
        </ScrollView>

        {/* UPCOMING PAYOUT HIGHLIGHT */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10, marginBottom: 12 }]}>Upcoming Payout</Text>
        <View style={[styles.highlightCard, { backgroundColor: theme.inputBg }]}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=5' }} style={styles.highlightAvatar} />
          <View style={styles.highlightInfo}>
            <Text style={[styles.highlightTitle, { color: theme.text }]}>Sarah is next</Text>
            <Text style={styles.highlightSubtitle}>Lagos Entrepreneurs</Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>3 days</Text>
            <Text style={styles.daysBadgeSub}>left</Text>
          </View>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          <TouchableOpacity><Text style={styles.viewAll}>See All</Text></TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          <ActivityItem icon="arrow-up" title="Contribution to Quicksave Group" date="Today, 10:24 AM" amount="-₦20,000" type="debit" theme={theme} />
          <ActivityItem icon="arrow-down" title="Wallet Funded" date="Yesterday, 14:30 PM" amount="+₦50,000" type="credit" theme={theme} />
          <ActivityItem icon="user-check" title="Invite Accepted" date="Oct 01, 09:15 AM" amount="" type="neutral" theme={theme} />
        </View>

      </ScrollView>

      {/* MOCK BOTTOM TAB BAR (Matches Figma) */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.inputBorder }]}>
        <NavItem icon="home" label="Home" isActive theme={theme} />
        <NavItem icon="users" label="Groups" theme={theme} />
        <NavItem icon="pie-chart" label="Savings" theme={theme} />
        <NavItem icon="user" label="Profile" theme={theme} />
      </View>
    </SafeAreaView>
  );
}







// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, marginBottom: 4 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF8C00', borderWidth: 2, borderColor: '#121212' },
  
  // Wallet Card
  balanceCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, marginBottom: 24 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { color: '#9BA1A6', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginBottom: 20 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  percentage: { color: '#34C759', fontSize: 14, fontWeight: '600' },
  qsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  qsBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  // Actions
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  // Groups
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  viewAll: { color: '#9BA1A6', fontSize: 14 },
  groupsScroll: { overflow: 'visible', marginBottom: 24 },
  groupCard: { width: 160, padding: 16, borderRadius: 16, marginRight: 16 },
  groupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  groupBadge: { backgroundColor: '#333', color: '#FFF', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  groupName: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, height: 40 },
  progressContainer: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { color: '#9BA1A6', fontSize: 10 },
  progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#FF8C00', borderRadius: 2 },
  nextDate: { color: '#9BA1A6', fontSize: 11 },

  // Highlight Card
  highlightCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  highlightAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  highlightInfo: { flex: 1 },
  highlightTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  highlightSubtitle: { color: '#9BA1A6', fontSize: 12 },
  daysBadge: { backgroundColor: '#FF8C0015', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  daysBadgeText: { color: '#FF8C00', fontSize: 14, fontWeight: 'bold' },
  daysBadgeSub: { color: '#FF8C00', fontSize: 10 },

  // Activity
  activityContainer: { gap: 16 },

  // Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, paddingBottom: 32, borderTopWidth: 1 },

});