import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, ActivityIndicator , useColorScheme, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { api } from '@/api/client';
import { Colors } from '@/theme/Colors';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMyGroups } from '@/store/slices/groupSlice';
import LoadingState from '@/components/ui/loading-state';
import ErrorState from '@/components/ui/error-state';
import EmptyState from '@/components/ui/empty-state';
import { useDispatch } from 'react-redux';
import PendingSyncBadge from '@/components/ui/pendingsync-badge';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function GroupsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

 const { activeGroups, completedGroups, isLoading, error } = useAppSelector((state) => state.groups);

  const { pendingContributions } = useAppSelector((state) => state.offlineQueue);
  const { isConnected, isInternetReachable } = useAppSelector((state) => state.network);
  const isOffline = isConnected === false || isInternetReachable === false;

  // Fetch groups from the backend
  const loadGroups = () => {
    dispatch(fetchMyGroups());
  };

  useEffect(() => {
    loadGroups();
  }, [dispatch]);

  // 4. Pull-to-refresh logic
   const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  // --- UI COMPONENTS ---

  const Header = () => (
    <View style={[styles.header, {backgroundColor: theme.background}]}>
      {/* <View style={{ width: 24 }} /> Spacer to center the logo */}
      <View style={styles.logoContainer}>
        <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
        <Text style={[styles.logoText,{ color: theme.text }]}>QUICKSAVE</Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/sub/notification')}>
        <Feather name="bell" size={20} color={theme.text }/>
      </TouchableOpacity>
    </View>
  );

  const Tabs = () => (
    <View style={[styles.tabsContainer,{ backgroundColor: theme.background,  borderBottomColor: theme.inputBorder }]}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Active' && [styles.activeTab, { borderBottomColor: theme.primary }]]}
        onPress={() => setActiveTab('Active')}
      >
        <Text style={[styles.tabText, { color: theme.textSecondary },activeTab === 'Active' && { color: theme.primary, fontWeight: 'bold' }]}>Active</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab,activeTab === 'Completed' && [styles.activeTab, { borderBottomColor: theme.primary }]]}
        onPress={() => setActiveTab('Completed')}
      >
        <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'Completed' &&  { color: theme.primary, fontWeight: 'bold' }]}>Completed</Text>
      </TouchableOpacity>
    </View>
  );

const GroupCard = ({ title, subtitle, progress, nextDate, membersCount, id }: any) => {
  const hasPendingAction = pendingContributions.some((c: any) => c.groupId === id);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} 
      onPress={() => router.push(`/sub/groups/${id}`)} // Use 'id' prop here
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}15` }]}>
          <Text style={[styles.statusText, { color: theme.primary }]}>ACTIVE</Text>
        </View>
      </View>
     
      {hasPendingAction && <PendingSyncBadge />}

      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>PROGRESS</Text>
          <Text style={[styles.progressValue, { color: theme.primary }]}>{progress}%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colorScheme === 'dark' ? '#111' : '#F3F4F6' }]}>
          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
        </View>
      </View>

      <View style={styles.nextPayoutContainer}>
        <View>
          <Text style={[styles.nextPayoutLabel, { color: theme.textSecondary }]}>Next Payout</Text>
          <Text style={[styles.nextPayoutDate, { color: theme.text }]}>{nextDate}</Text>
        </View>
        <View style={styles.avatarGroup}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=1' }} style={[styles.avatar, { borderColor: theme.inputBg, zIndex: 3 }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=2' }} style={[styles.avatar, { borderColor: theme.inputBg, zIndex: 2, marginLeft: -10 }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=3' }} style={[styles.avatar, { borderColor: theme.inputBg, zIndex: 1, marginLeft: -10 }]} />
          <View style={[styles.avatarCount, { backgroundColor: colorScheme === 'dark' ? '#111' : '#F3F4F6', borderColor: theme.inputBg, marginLeft: -10 }]}>
            <Text style={[styles.avatarCountText, { color: theme.textSecondary }]}>+{membersCount}</Text>
          </View>
        </View>
      </View>

      {/* FIXED: Changed 'groups?.id' to 'id' */}
      <View style={[styles.detailsButton, { borderColor: theme.inputBorder }]}>
        <Text style={[styles.detailsButtonText, { color: theme.text }]}>View Details</Text>
      </View>
    </TouchableOpacity>
  );
};

  const CreateGroupPromoCard = () => (
    <TouchableOpacity  style={[
      styles.promoCard, 
      { backgroundColor: theme.inputBg, borderColor: theme.primary },
      isOffline && { opacity: 0.5, borderColor: theme.textSecondary } // Fade out if offline
    ]} 
    onPress={() => {
      if (isOffline) {
        alert("You must be online to create a new group.");
        return;
      }
      router.push('/sub/groups/create-group');
    }}
    disabled={isOffline} >
      <View style={[styles.promoIconBg, { backgroundColor: theme.primary }]}>
        <Feather name="plus" size={24} color="#FFF" />
      </View>
      <Text style={[styles.promoTitle, { color: theme.text }]}>Start a New Group</Text>
      <Text style={[styles.promoSubtitle, { color: theme.textSecondary }]}>Pool resources with friends or colleagues securely.</Text>
    </TouchableOpacity>
  );

  if (error && activeGroups.length === 0 && completedGroups.length === 0) {
    return <ErrorState message={error} onRetry={loadGroups} />;
  }



  // If it's loading for the first time (not pulling to refresh) and we have no cached groups.
  if (isLoading && !refreshing && activeGroups.length === 0 && completedGroups.length === 0) {
    return <LoadingState message="Fetching your groups..." />;
  }


  return (
    <SafeAreaView style={[styles.safeArea,{ backgroundColor: theme.background }]}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
        
        <View style={[styles.pageTitleContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>My Groups</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>Manage your savings circles and payout schedules.</Text>
        </View>

        <Tabs />

          {activeTab === 'Active' ? (
            <View style={styles.listContainer}>
            {/* 👉 SCENARIO 3: EMPTY STATE (Active Groups) */}
            {activeGroups.length === 0 ? (
              <EmptyState 
                icon="users"
                title="No Active Groups"
                description="You are not part of any active savings circles right now."
                actionLabel="Start a Group"
                onAction={() => router.push('/sub/groups/create-group')}
              />
            ) : (
              <>
                <CreateGroupPromoCard />
              {activeGroups.map((group: any) => (
                <Animated.View 
    key={group.id}
    // Stagger the animation by multiplying the index!
    entering={FadeInDown.delay(index * 100).springify().damping(12)}
  >
  <GroupCard 
    key={group.id} // Standard React key
    id={group.id}  // Pass the ID to the component
    title={group.name} 
    subtitle={`${group.frequency} Contribution`} 
    progress={group.progress || 0} 
    nextDate={group.nextPayoutDate ? new Date(group.nextPayoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} 
    membersCount={group.membersCount || 0} 
  />
  </Animated.View>
))}
              </>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
             {/* Map completed groups here if any */}
             {completedGroups.length === 0 ? (
                <EmptyState 
                  icon="check-circle"
                  title="No Completed Groups"
                  description="Groups that have successfully completed their cycles will appear here."
                />
             ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No completed groups yet.</Text>
                </View>
             )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) from the Figma design */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => router.push('/sub/groups/create-group')}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Base Layout
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' }, // Light gray background from Figma
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  logoContainer: { flexDirection: 'row', alignItems: 'left', gap: 6 },
  logoText: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#11181C' },

  // Page Titles
  pageTitleContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, backgroundColor: '#FFF' },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#11181C', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#687076' },

  // Tabs
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { paddingVertical: 12, marginRight: 24 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#FF8C00' },
  tabText: { fontSize: 14, color: '#687076', fontWeight: '500' },
  activeTabText: { color: '#FF8C00', fontWeight: 'bold' },

  // List
  listContainer: { padding: 20, gap: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#687076', fontSize: 14 },

  // Standard Group Card
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#11181C', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#687076' },
  statusBadge: { backgroundColor: '#FF8C0015', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FF8C00', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  // Progress Bar
  progressContainer: { marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: 'bold', color: '#687076', letterSpacing: 1 },
  progressValue: { fontSize: 10, fontWeight: 'bold', color: '#FF8C00' },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#FF8C00', borderRadius: 3 },

  // Next Payout & Avatars
  nextPayoutContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  nextPayoutLabel: { fontSize: 11, color: '#687076', marginBottom: 2 },
  nextPayoutDate: { fontSize: 14, fontWeight: 'bold', color: '#11181C' },
  avatarGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFF' },
  avatarCount: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  avatarCountText: { fontSize: 10, fontWeight: 'bold', color: '#687076' },

  // Buttons
  detailsButton: { width: '100%', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  detailsButtonText: { fontSize: 13, fontWeight: 'bold', color: '#11181C' },

  // Promo Card (Dotted Border)
  promoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, borderWidth: 1.5, borderColor: '#FF8C00', borderStyle: 'dashed', alignItems: 'center', marginVertical: 8 },
  promoIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF8C00', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  promoTitle: { fontSize: 16, fontWeight: 'bold', color: '#11181C', marginBottom: 4 },
  promoSubtitle: { fontSize: 12, color: '#687076', textAlign: 'center', paddingHorizontal: 20 },

  // Floating Action Button
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF8C00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});