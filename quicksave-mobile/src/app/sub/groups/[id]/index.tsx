import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, useColorScheme, ActivityIndicator, 
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { timeAgo } from '@/utils/time';

// Mock Data matching the Figma exact states
const MOCK_ROTATION = [
  { id: '1', rank: 1, name: 'Adeyemi O.', amount: '₦10,000', status: 'paid', isReceiving: true, avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '2', rank: 2, name: 'Ngozi A.', amount: '₦10,000', status: 'pending', isReceiving: false, avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', rank: 3, name: 'Chinedu E.', amount: '₦10,000', status: 'failed', isReceiving: false, avatar: null },
  { id: '4', rank: 4, name: 'Folake M.', amount: '₦10,000', status: 'pending', isReceiving: false, avatar: null },
];

const MOCK_ACTIVITY = [
  { id: '1', text: 'David J. contributed ₦10,000', time: '2 hours ago', type: 'contribution' },
  { id: '2', text: 'Ngozi A.: "Will send mine by evening!"', time: '5 hours ago', type: 'chat' },
  { id: '3', text: 'Round 4 collection started.', time: '1 day ago', type: 'alert' },
];

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(false); // Set to true when hitting real API
  const [groupData, setGroupData] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  // Fetch the data from your Day 17 & 20 endpoints!
  useEffect(() => {

    const fetchGroupData = async () => {
      try {
        const [groupRes, timelineRes] = await Promise.all([
          api.get(`/groups/${groupId}`),
          api.get(`/groups/${groupId}/rotation`)
        ]);
        setGroupData({ ...groupRes.data.data, timeline: timelineRes.data.data });
      } catch (error) {
        console.error("Failed to fetch group", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupData();
  
  }, [groupId]);

  const handleChangeStatus = () => {
    setMenuVisible(false); // Close menu first
    // In a real app, this might open a bottom sheet to select "PAUSED" or "COMPLETED"
    Alert.alert('Change Status', 'Would you like to Pause or Complete this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pause', onPress: () => console.log('Paused Group') },
      { text: 'Complete', onPress: () => console.log('Completed Group') },
    ]);
  };

   const handleDeleteGroup = () => {
    setMenuVisible(false); // Close menu first
    Alert.alert(
      'Delete Group?', 
      'Are you sure you want to permanently delete this group? This action cannot be undone.', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            console.log('Deleted Group');
            router.replace('/(tabs)/groups'); // Kick them back to the groups list
          } 
        },
      ]
    );
  };


  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />;
      case 'pending': return <View style={styles.pendingDot} />;
      case 'failed': return <MaterialCommunityIcons name="close-circle" size={16} color="#FF3B30" />;
      default: return null;
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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Lagos Entrepreneurs Circle</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerIcon} onPress={() => setMenuVisible(true)}>
          <Feather name="more-vertical" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
       <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)} // Clicking outside closes it
        >
          <View style={[styles.dropdownMenu, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={handleChangeStatus}>
              <Feather name="activity" size={16} color={theme.text} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>Change Status</Text>
            </TouchableOpacity>

            <View style={[styles.dropdownDivider, { backgroundColor: theme.inputBorder }]} />

            <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteGroup}>
              <Feather name="trash-2" size={16} color="#FF3B30" />
              <Text style={[styles.dropdownText, { color: '#FF3B30' }]}>Delete Group</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NEXT PAYOUT CARD */}
        <View style={[styles.payoutCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.payoutLeft}>
            <View style={styles.walletIconBg}>
              <FontAwesome5 name="wallet" size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.payoutLabel}>NEXT PAYOUT</Text>
              <Text style={[styles.payoutAmount, { color: theme.text }]}>₦120,000</Text>
            </View>
          </View>
          <View style={styles.payoutRight}>
            <Text style={styles.inText}>In</Text>
            <Text style={[styles.daysText, { color: theme.primary }]}>12 days</Text>
          </View>
        </View>

        {/* ROTATION ORDER */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Rotation Order</Text>
          <View style={[styles.pillBadge, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <Text style={[styles.pillText, { color: theme.textSecondary }]}>12 Members</Text>
          </View>
        </View>

        <View style={styles.rotationList}>
          {MOCK_ROTATION.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.rotationItem, 
                { backgroundColor: theme.inputBg },
                item.isReceiving && { borderLeftWidth: 3, borderLeftColor: theme.primary } // Active receiver highlight
              ]}
            >
              <Text style={[styles.rank, { color: theme.textSecondary }]}>{item.rank}</Text>
              
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background }]}>
                  <Feather name="user" size={14} color={theme.textSecondary} />
                </View>
              )}

              <View style={styles.rotationInfo}>
                <Text style={[styles.rotationName, { color: theme.text }]}>{item.name}</Text>
                {item.isReceiving && (
                  <Text style={[styles.receivingText, { color: theme.primary }]}> (Receiving)</Text>
                )}
              </View>

              <Text style={[styles.rotationAmount, { color: theme.textSecondary }]}>{item.amount}</Text>
              <View style={styles.statusIconContainer}>
                {renderStatusIcon(item.status)}
              </View>
            </View>
          ))}
        </View>

        {/* LIVE ACTIVITY TIMELINE */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Activity</Text>
        </View>

        <View style={[styles.activityContainer, { backgroundColor: theme.inputBg }]}>
          {MOCK_ACTIVITY.map((activity, index) => {
            const isLast = index === MOCK_ACTIVITY.length - 1;
            
            // Determine icon based on activity type
            let iconName = "bell";
            let iconColor = theme.primary;
            let iconBg = `${theme.primary}15`;

            if (activity.type === 'contribution') {
              iconName = 'money-bill-wave';
              iconColor = '#34C759';
              iconBg = '#34C75915';
            } else if (activity.type === 'chat') {
              iconName = 'message-square';
              iconColor = theme.textSecondary;
              iconBg = theme.background;
            }

            return (
              <View key={activity.id} style={styles.timelineRow}>
                {/* Timeline Line & Icon */}
                <View style={styles.timelineGraphic}>
                  <View style={[styles.timelineIcon, { backgroundColor: iconBg }]}>
                    <FontAwesome5 name={iconName} size={12} color={iconColor} />
                  </View>
                  {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.inputBorder }]} />}
                </View>

                {/* Timeline Content */}
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineText, { color: theme.text }]}>{activity.text}</Text>
                  <Text style={[styles.timelineTime, { color: theme.textSecondary }]}>{activity.time}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER ACTION */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.contributeButton, { backgroundColor: theme.primary }]}>
          <Text style={styles.contributeText}>Contribute ₦10,000</Text>
          <Feather name="arrow-right" size={18} color="#111" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C75915', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759', marginRight: 4 },
  activeText: { fontSize: 10, color: '#34C759', fontWeight: 'bold' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Payout Card
  payoutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  payoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF8C0015', justifyContent: 'center', alignItems: 'center' },
  payoutLabel: { fontSize: 10, fontWeight: 'bold', color: '#9BA1A6', letterSpacing: 1, marginBottom: 4 },
  payoutAmount: { fontSize: 20, fontWeight: 'bold' },
  payoutRight: { alignItems: 'flex-end' },
  inText: { fontSize: 12, color: '#9BA1A6', marginBottom: 2 },
  daysText: { fontSize: 20, fontWeight: 'bold' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { fontSize: 10, fontWeight: 'bold' },

  // Rotation List
  rotationList: { gap: 8, marginBottom: 24 },
  rotationItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  rank: { width: 24, fontSize: 12, fontWeight: 'bold' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  rotationInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rotationName: { fontSize: 14, fontWeight: '600' },
  receivingText: { fontSize: 12, fontWeight: 'bold' },
  rotationAmount: { fontSize: 12 },
  statusIconContainer: { width: 24, alignItems: 'flex-end' },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFCC00' },

  // Activity Timeline
  activityContainer: { padding: 20, borderRadius: 16, marginBottom: 20 },
  timelineRow: { flexDirection: 'row', minHeight: 60 },
  timelineGraphic: { width: 30, alignItems: 'center' },
  timelineIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  timelineLine: { position: 'absolute', top: 24, bottom: 0, width: 2, zIndex: 1 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 24, paddingTop: 2 },
  timelineText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  timelineTime: { fontSize: 11 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  contributeButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  contributeText: { color: '#111', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdownMenu: { 
    position: 'absolute', 
    top: 60, // Sits right below the header
    right: 20, // Aligned to the right edge
    width: 170, 
    borderRadius: 12, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8, // For Android shadow
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  dropdownText: { fontSize: 15, fontWeight: '500' },
  dropdownDivider: { height: 1, width: '100%' },
});