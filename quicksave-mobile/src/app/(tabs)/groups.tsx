import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, ActivityIndicator , useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { api } from '@/api/client';
import { Colors } from '@/theme/Colors';

export default function GroupsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups from the backend
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Hitting the Day 15/17 endpoints. 
        // Note: If you don't have a GET /groups endpoint yet, this will fail gracefully and show the UI.
        const res = await api.get('/groups');
        if (res.data?.data) {
          setGroups(res.data.data);
        }
      } catch (error) {
        console.log("Could not fetch groups, showing empty/mock state.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // --- UI COMPONENTS ---

  const Header = () => (
    <View style={[styles.header, {backgroundColor: theme.background}]}>
      {/* <View style={{ width: 24 }} /> Spacer to center the logo */}
      <View style={styles.logoContainer}>
        <FontAwesome5 name="shield-alt" size={16} color="#FF8C00" />
        <Text style={[styles.logoText,{ color: theme.text }]}>QUICKSAVE</Text>
      </View>
      <TouchableOpacity>
        <Feather name="bell" size={20} color={theme.textSecondary }/>
      </TouchableOpacity>
    </View>
  );

  const Tabs = () => (
    <View style={[styles.tabsContainer,{ backgroundColor: theme.background }]}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
        onPress={() => setActiveTab('Active')}
      >
        <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
        onPress={() => setActiveTab('Completed')}
      >
        <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>Completed</Text>
      </TouchableOpacity>
    </View>
  );

  const GroupCard = ({ title, subtitle, progress, nextDate, membersCount }: any) => (
    <View style={[styles.card,{ backgroundColor: theme.background }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, {color: theme.textSecondary}]}>{subtitle}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.nextPayoutContainer}>
        <View>
          <Text style={styles.nextPayoutLabel}>Next Payout</Text>
          <Text style={styles.nextPayoutDate}>{nextDate}</Text>
        </View>
        <View style={styles.avatarGroup}>
          {/* Overlapping Mock Avatars */}
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=1' }} style={[styles.avatar, { zIndex: 3 }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=2' }} style={[styles.avatar, { zIndex: 2, marginLeft: -10 }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=3' }} style={[styles.avatar, { zIndex: 1, marginLeft: -10 }]} />
          <View style={[styles.avatarCount, { marginLeft: -10 }]}>
            <Text style={styles.avatarCountText}>+{membersCount}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.detailsButton}
        // In a real app, pass the group ID here: router.push(`/groups/${id}`)
        onPress={() => console.log('View Details')} 
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const CreateGroupPromoCard = () => (
    <TouchableOpacity style={styles.promoCard} onPress={() => console.log('Create Group')}>
      <View style={styles.promoIconBg}>
        <Feather name="plus" size={24} color="#FFF" />
      </View>
      <Text style={styles.promoTitle}>Start a New Group</Text>
      <Text style={styles.promoSubtitle}>Pool resources with friends or colleagues securely.</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea,{ backgroundColor: theme.background }]}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>My Groups</Text>
          <Text style={styles.pageSubtitle}>Manage your savings circles and payout schedules.</Text>
        </View>

        <Tabs />

        {activeTab === 'Active' ? (
          <View style={styles.listContainer}>
            {/* If backend returns data, map it here. For now, we use the Figma mock data to perfect the UI */}
            
            <GroupCard 
              title="Lagos Entrepreneurs" 
              subtitle="Monthly Savings Circle" 
              progress={65} 
              nextDate="Oct 24, 2026" 
              membersCount={8} 
            />

            <GroupCard 
              title="Tech Founders XI" 
              subtitle="Weekly Contribution" 
              progress={30} 
              nextDate="Nov 02, 2026" 
              membersCount={2} 
            />

            <CreateGroupPromoCard />

            <GroupCard 
              title="Family Vacation Fund" 
              subtitle="Annual Target" 
              progress={88} 
              nextDate="Dec 15, 2026" 
              membersCount={5} 
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed groups yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) from the Figma design */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log('Create Group')}>
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