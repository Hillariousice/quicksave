import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, useColorScheme, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import ActionBtn from '@/components/home/action-btn';
import ActivityItem from '@/components/home/activity-item';
import { GroupCard } from '@/components/card/group-card';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchWalletData } from '@/store/slices/walletSlice';
import { fetchMyGroups } from '@/store/slices/groupSlice';
import CachedAvatar from '@/components/ui/cached-avatar';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Global State
  const user = useAppSelector((state) => state.auth.user);
  const { balance, transactions, isLoading: walletLoading } = useAppSelector((state) => state.wallet);
  const { activeGroups, isLoading: groupsLoading } = useAppSelector((state) => state.groups);

 const { pendingContributions, isSyncing, syncAttempts } = useAppSelector(state => state.offlineQueue);
  // Local State
  const [showBalance, setShowBalance] = useState(true);

const { isConnected: isSocketLive } = useAppSelector((state) => state.socket);

  // Fetch Dashboard Data
useEffect(() => {
    dispatch(fetchWalletData());
    dispatch(fetchMyGroups());
  }, [dispatch]);

   const upcomingGroup = activeGroups.length > 0 
    ? [...activeGroups].sort((a, b) => new Date(a.nextPayoutDate).getTime() - new Date(b.nextPayoutDate).getTime())[0] 
    : null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
      .format(amount)
      .replace('.00', ''); // Clean up trailing zeros
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (walletLoading && groupsLoading && activeGroups.length === 0) {
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
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning,</Text>
      
      {/* 👉 NEW: Mode-Aware Live Indicator */}
      {isSocketLive && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, marginRight: 4 }} />
          <Text style={{ fontSize: 9, color: theme.primary, fontWeight: 'bold' }}>LIVE</Text>
        </View>
      )}
    </View>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.firstName || 'Hillary'}</Text>
          </View>
          

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>

            <TouchableOpacity onPress={() => router.push('/sub/messages')}>
              <Feather name="message-square" size={22} color={theme.text} />
              <View style={[styles.notificationDot, { right: -2, top: -2 }]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarContainer} onPress={()=> router.push('/profile')}>
              <CachedAvatar uri={user?.avatar} size={44} />
            </TouchableOpacity>
          </View>
          {pendingContributions.length > 0 && (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    {isSyncing ? (
      <ActivityIndicator size="small" color={theme.primary} />
    ) : (
      <Feather 
        name="cloud-off" 
        size={16} 
        // ⭐️ Dynamic Theme + Alert Color! 
        // If we tried and failed 3 times, turn it Danger Red. Otherwise, standard text color.
        color={syncAttempts > 2 ? '#FF3B30' : theme.textSecondary} 
      />
    )}
    <Text style={{ color: theme.textSecondary, marginLeft: 6 }}>
      {pendingContributions.length} Pending
    </Text>
  </View>
)}
        </View>

        {/* WALLET BALANCE CARD */}
         <Animated.View entering={FadeInDown.duration(600).springify().damping(14)}>
          <LinearGradient
            colors={[theme.cardGradientStart, theme.cardGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.balanceCard, { borderColor: theme.inputBorder, borderWidth: 1 }]}
          >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Feather name={showBalance ? "eye" : "eye-off"} size={18} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {showBalance ? formatCurrency(balance) : '₦ ••••••'}
            </Text>
            <Text style={styles.percentage}>+2.4%</Text>
          </View>

          <View style={styles.qsBadge}>
            <FontAwesome5 name="shield-alt" size={12} color={theme.primary} />
            <Text style={styles.qsBadgeText}>QS Wallet</Text>
          </View>
         </LinearGradient>
        </Animated.View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionsContainer}>
          <ActionBtn icon="arrow-up" label="Contribute" theme={theme}  onPress={()=>{
              if (upcomingGroup?.id) {
                router.push({pathname:'/sub/groups/[id]/contribute-member', params: {id: upcomingGroup.id}});
              } else {
                console.log("No group found to invite to!");
              }
            }}/>
          <ActionBtn icon="arrow-down" label="Fund" theme={theme} onPress={()=> router.push('/sub/wallet/fund')} />
          <ActionBtn icon="external-link" label="Withdraw" theme={theme} onPress={()=> router.push('/sub/wallet/withdraw')}/>
          <ActionBtn icon="users" label="Invite" theme={theme}   onPress={() => {
    // If the user is in at least one group, let them invite people to it
    if (activeGroups.length > 0) {
      // We use the 'upcomingGroup' or the first active group
      const targetId = upcomingGroup?.id || activeGroups[0].id;
      router.push({
        pathname: '/sub/groups/[id]/invite-member', 
        params: { id: targetId }
      });
    } else {
      // 👉 NEW USER PATH: They aren't in a group, so they probably 
      // want to JOIN one using a code they received elsewhere.
      router.push('/sub/groups/join'); 
    }
  }}  />
        </View>

        {/* ACTIVE GROUPS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Groups</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>

           {activeGroups.map((group: any) => (
            <GroupCard 
              key={group.id}
              title={group.name}
              type={`${group.frequency}`}
              progress={group.progress || 0}
              nextDate={`${formatDate(group.nextPayoutDate)}`}
              groupId={group.id}
            />
          ))}
          {activeGroups.length === 0 && (
            <Text style={{ color: theme.textSecondary, marginLeft: 5 }}>No active groups yet.</Text>
          )}
         
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
          <TouchableOpacity  onPress={() => router.push('/sub/wallet/transaction-history')}><Text style={styles.viewAll}>See All</Text></TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
      {transactions.slice(0, 3).map((tx: any) => (
            <ActivityItem 
              key={tx.id}
              icon={tx.type === 'CREDIT' || tx.type === 'FUNDING' ? "arrow-down" : "arrow-up"} 
              title={tx.description} 
              date={new Date(tx.createdAt).toLocaleDateString()} 
              amount={`${tx.type === 'DEBIT' || tx.type === 'CONTRIBUTION' ? '-' : '+'}${formatCurrency(tx.amount)}`} 
              type={tx.type === 'DEBIT' || tx.type === 'CONTRIBUTION' ? 'debit' : 'credit'} 
              theme={theme} 
            />
          ))}
          {transactions.length === 0 && (
            <Text style={{ color: theme.textSecondary }}>No recent transactions.</Text>
          )}
        </View>

      </ScrollView>

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

  // // Bottom Nav
  // bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, paddingBottom: 32, borderTopWidth: 1 },

});