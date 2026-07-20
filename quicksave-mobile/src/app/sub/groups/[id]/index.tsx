import React, { useState, useEffect, useCallback, Profiler } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, useColorScheme, ActivityIndicator, 
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
// import { timeAgo } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchGroupActivity, fetchGroupDetails } from '@/store/slices/groupSlice';
import LoadingState from '@/components/ui/loading-state';
import { updateStatusThunk } from '@/store/slices/groupSlice';
import { timeAgo } from '@/utils/time';
import {socketService} from '@/api/services/socket.service'
import CachedAvatar from '@/components/ui/cached-avatar';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;


   const dispatch = useAppDispatch();
  
  // 👉 Pull current group details from Redux
  const { currentGroup, currentTimeline, currentActivity, isDetailLoading } = useAppSelector(state => state.groups);

  const [isViewingLive, setIsViewingLive] = useState(false);
  const [loading, setLoading] = useState(false); // Set to true when hitting real API
 
  const [menuVisible, setMenuVisible] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  
  useEffect(() => {
    if (!groupId || groupId === 'undefined'){ return};
      dispatch(fetchGroupDetails(groupId as string));
      dispatch(fetchGroupActivity(groupId as string));
    
  }, [groupId]);

   useEffect(() => {
    const fetchHistory = async () => {
      try {
        
        const res = await api.get(`/groups/${groupId}/activity`);
        
        // Map the backend DB logs to our UI format
       const formattedLogs = res.data.data.map((log: any) => ({
  id: log.id,
  text: log.message,
  time: timeAgo(log.createdAt),
  type: log.action === 'CONTRIBUTION' ? 'contribution' : 'alert',
  // Ensure this is a string, though usually API responses already are
  createdAt: typeof log.createdAt === 'string' ? log.createdAt : new Date(log.createdAt).toISOString(),
}))
        setActivities(formattedLogs);
      } catch (error) {
        console.log("Could not fetch activity history.");
      }
    };
    if (groupId) fetchHistory();
  }, [groupId]);
  
  // The Room Lifecycle Hook
   useFocusEffect(
    useCallback(() => {
      if (!groupId) return;

      // When screen focuses: Join room & attach listener
      socketService.joinGroupScreen(groupId as string);
      setIsViewingLive(true);

    const handleNewActivity = (newActivity: any) => {
  // Ensure incoming socket data converts dates to strings immediately
  const serializableActivity = {
    ...newActivity,
    createdAt: new Date().toISOString(), // Use string here
    time: 'Just now'
  };
  setActivities((prev) => [serializableActivity, ...prev]);
};

      socketService.onScreenActivity(handleNewActivity);

      // When screen unfocuses: Leave room & detach listener
      return () => {
        socketService.leaveGroupScreen(groupId as string);
        socketService.offScreenActivity(handleNewActivity);
        setIsViewingLive(false);
      };
    }, [groupId])
  );



  const handleChangeStatus = () => {
    setMenuVisible(false);

    Alert.alert(
      'Change Group Status', 
      'Update the lifecycle of this savings circle:', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pause Group', 
          onPress: () => handleDispatchStatus('PAUSED') 
        },
        { 
          text: 'Set to Active', 
          onPress: () => handleDispatchStatus('ACTIVE') 
        },
        { 
          text: 'Mark as Completed', 
          onPress: () => handleDispatchStatus('COMPLETED'),
          style: 'default'
        },
      ]
    );
  };

  const handleDispatchStatus = async (newStatus: string) => {
    try {
      await dispatch(updateStatusThunk({ 
        groupId: groupId as string, 
        status: newStatus 
      })).unwrap();
      
      Alert.alert('Success', `Group status updated to ${newStatus}`);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update status');
    }
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

    // 👉 The callback that receives the render metrics!
  const onRenderCallback = (
    id: string, // the "id" prop of the Profiler tree
    phase: "mount" | "update", // "mount" (first render) or "update" (re-render)
    actualDuration: number, // time spent rendering the committed update
    baseDuration: number, // estimated time to render the entire subtree
    startTime: number,
    commitTime: number
  ) => {
    // Only log heavy renders over 16ms (which causes frame drops below 60fps)
    if (actualDuration > 16) {
      console.warn(`[React Profiler 🐢] ${id} took ${actualDuration.toFixed(2)}ms to ${phase}`);
    } else {
      console.log(`[React Profiler ⚡] ${id} took ${actualDuration.toFixed(2)}ms to ${phase}`);
    }
  };


  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />;
      case 'pending': return <View style={styles.pendingDot} />;
      case 'failed': return <MaterialCommunityIcons name="close-circle" size={16} color="#FF3B30" />;
      default: return null;
    }
  };
  
  if (isDetailLoading || !currentGroup) return <LoadingState />;
  const totalPayout = currentGroup.contributionAmount * (currentGroup.members?.length || 0);
  const displayList = currentTimeline?.length > 0 ? currentTimeline : currentGroup.members;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        


  <View style={styles.headerTitleContainer}>
    <Text style={[styles.headerTitle, { color: theme.primary }]}>{currentGroup?.name}</Text>
    <View style={[
        styles.activeBadge, 
        currentGroup?.status === 'PAUSED' && { backgroundColor: '#FFCC0020' },
        currentGroup?.status === 'COMPLETED' && { backgroundColor: '#007AFF20' }
    ]}>
      <View style={[
          styles.activeDot, 
          currentGroup?.status === 'PAUSED' && { backgroundColor: '#FFCC00' },
          currentGroup?.status === 'COMPLETED' && { backgroundColor: '#007AFF' }
      ]} />
      <Text style={[
          styles.activeText,
          currentGroup?.status === 'PAUSED' && { color: '#FFCC00' },
          currentGroup?.status === 'COMPLETED' && { color: '#007AFF' }
      ]}>
        {currentGroup?.status}
      </Text>
    </View>
     {isViewingLive && (
              <View style={[styles.activeBadge, { backgroundColor: theme.primary + '20' }]}>
                <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.activeText, { color: theme.primary }]}>Live View</Text>
              </View>
            )}
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
            <TouchableOpacity style={styles.dropdownItem} onPress={()=> router.push(`/sub/messages/group/${groupId}`)}>
              <Feather name="message-circle" size={16} color={theme.text} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>Group message</Text>
            </TouchableOpacity>
          
             <View style={[styles.dropdownDivider, { backgroundColor: theme.inputBorder }]} />

             <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteGroup}>
              <Feather name="trash-2" size={16} color="#FF3B30" />
              <Text style={[styles.dropdownText, { color: '#FF3B30' }]}>Delete Group</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

  <Profiler id="GroupDetailScrollView" onRender={onRenderCallback}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NEXT PAYOUT CARD */}
        <View style={[styles.payoutCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.payoutLeft}>
            <View style={styles.walletIconBg}>
              <FontAwesome5 name="wallet" size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.payoutLabel}>NEXT PAYOUT</Text>
              <Text style={[styles.payoutAmount, { color: theme.text }]}> ₦{totalPayout.toLocaleString()}</Text>
            </View>
          </View>
          {/* <View style={styles.payoutRight}>
            <Text style={styles.inText}>In</Text>
            <Text style={[styles.daysText, { color: theme.primary }]}>12 days</Text>
          </View> */}
          <View style={styles.payoutRight}>
            <Text style={styles.inText}>Status</Text>
            <Text style={[styles.daysText, { color: theme.primary }]}>
              {currentGroup.nextPayoutDate ? "Active" : "Pending"}
            </Text>
          </View>
        </View>

 
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => router.push(`/sub/groups/${groupId}/rotate-member`)} 
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Rotation Timeline</Text>
          <View style={[styles.pillBadge, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <Text style={[styles.pillText, { color: theme.textSecondary }]}>View Full</Text>
          </View>
        </TouchableOpacity>




<View style={styles.rotationList}>
          {displayList?.map((item: any, index: number) => (
            <View key={item.id} style={[styles.rotationItem, { backgroundColor: theme.inputBg }]}>
              {/* Rank / Position */}
              <Text style={[styles.rank, { color: theme.textSecondary }]}>
                {item.position || index + 1}
              </Text>
              
              {/* Avatar */}
              {item.user?.avatar ? (
                  <CachedAvatar uri={item.avatar} size={32} style={{ marginRight: 12 }} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background }]}>
                  <Feather name="user" size={14} color={theme.textSecondary} />
                </View>
              )}

              {/* Name & Receiving Info */}
              <View style={styles.rotationInfo}>
                <Text style={[styles.rotationName, { color: theme.text }]}>
                  {item.user?.firstName} {item.user?.lastName?.charAt(0)}.
                </Text>
                {item.status === 'PROCESSING' && (
                   <Text style={[styles.receivingText, { color: theme.primary }]}> (Receiving)</Text>
                )}
              </View>

              {/* Amount per person */}
              <Text style={[styles.rotationAmount, { color: theme.textSecondary }]}>
                ₦{currentGroup.contributionAmount.toLocaleString()}
              </Text>

              {/* Real Status Icon from DB */}
              <View style={styles.statusIconContainer}>
                {item.status === 'ACTIVE' || item.status === 'PAID' ? (
                   <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />
                ) : (
                   <View style={styles.pendingDot} />
                )}
              </View>
            </View>
          ))}
        </View>
        
        {/* LIVE ACTIVITY TIMELINE */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Activity</Text>
        </View>

       <View style={[styles.activityContainer, { backgroundColor: theme.inputBg }]}>
          {activities.length === 0 ? (
             <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 10 }}>No activity yet. Be the first to contribute!</Text>
          ) : (
            activities.map((activity: any, index: any) => {
              const isLast = index === activities.length - 1;
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
                  <View style={styles.timelineGraphic}>
                    <View style={[styles.timelineIcon, { backgroundColor: iconBg }]}>
                      <FontAwesome5 name={iconName as any} size={12} color={iconColor} />
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.inputBorder }]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineText, { color: theme.text }]}>{activity.text}</Text>
                    {/* Convert static time to dynamic "timeAgo" if it's not a fresh socket event */}
                    <Text style={[styles.timelineTime, { color: theme.textSecondary }]}>
                      {activity.time === 'Just now' ? activity.time : timeAgo(activity.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
     
      </ScrollView>
</Profiler>
      {/* FOOTER ACTION */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.contributeButton, { backgroundColor: theme.primary }]} onPress={() => router.push(`/sub/groups/${groupId}/contribute-member`)}>
          <Text style={styles.contributeText}>Contribute ₦{currentGroup.contributionAmount.toLocaleString()}</Text>
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
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C75915', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 , marginBottom: 4},
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