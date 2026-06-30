import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ScrollView, FlatList, Image, useColorScheme, ActivityIndicator, 
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { GroupService } from '@/api/services/group.service';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchGroupDetails } from '@/store/slices/groupSlice';


export default function InviteMembersScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams(); // Gets the group ID from the URL
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { currentGroup, isDetailLoading } = useAppSelector((state) => state.groups);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
   useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupDetails(groupId as string));
    }
  }, [groupId]);

  // 3. Real-time Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setSearching(true);
        try {
          const users = await GroupService.searchUsers(searchQuery);
          // Filter out users who are already members of this group
          const filtered = users.filter((u: any) => 
            !currentGroup?.members?.some((m: any) => m.userId === u.id)
          );
          setSearchResults(filtered);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentGroup]);

  // 4. Capacity Calculations from Backend Data
  const currentMembersCount = currentGroup?.members?.length || 0;
  const maxCapacity = currentGroup?.maxCapacity || 0;
  const totalSlotsAfterInvite = currentMembersCount + selectedUsers.length;
  const progressPercentage = maxCapacity > 0 ? (totalSlotsAfterInvite / maxCapacity) * 100 : 0;

  const toggleUserSelection = (user: any) => {
    const isSelected = selectedUsers.find((u) => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      if (totalSlotsAfterInvite >= maxCapacity) {
        Alert.alert("Capacity Reached", "You cannot select more members than the group capacity allows.");
        return;
      }
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) return;
    setLoading(true);
    try {
      await GroupService.inviteMembers(groupId as string, selectedUsers.map(u => u.id));
      Alert.alert("Success", "Invitations sent successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

   if (isDetailLoading || !currentGroup) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Invite Members</Text>
        </TouchableOpacity>
        <Feather name="help-circle" size={20} color={theme.textSecondary} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SEARCH BAR */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
          <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by phone or email"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* CAPACITY CARD */}
        <View style={[styles.capacityCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.capacityHeader}>
            <View style={styles.capacityLabelRow}>
              <FontAwesome5 name="users" size={14} color={theme.primary} />
              <Text style={[styles.capacityTitle, { color: theme.text }]}>Group Capacity</Text>
            </View>
            <Text style={[styles.capacityText, { color: theme.primary }]}>
              {totalSlotsAfterInvite}/{maxCapacity} Slots Filled
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: theme.primary }]} />
          </View>

          <View style={styles.capacityFooter}>
            <Feather name="info" size={12} color={theme.textSecondary} />
            <Text style={[styles.capacitySubtext, { color: theme.textSecondary }]}>
              Invite {maxCapacity - totalSlotsAfterInvite} more friends to maximize savings efficiency.
            </Text>
          </View>
        </View>

        {/* SELECTED USERS (HORIZONTAL) */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SELECTED ({selectedUsers.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
              {selectedUsers.map((user) => (
                <View key={user.id} style={styles.selectedUser}>
                  <View style={styles.selectedAvatarContainer}>
                    <Image source={{ uri: user.avatar }} style={[styles.selectedAvatar, { borderColor: theme.primary }]} />
                    <TouchableOpacity 
                      style={[styles.removeIcon, { backgroundColor: theme.inputBg, borderColor: theme.background }]}
                      onPress={() => toggleUserSelection(user)}
                    >
                      <Feather name="x" size={10} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.selectedName, { color: theme.text }]} numberOfLines={1}>
                    {user.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SUGGESTED CONTACTS (VERTICAL) */}
          <View style={styles.suggestedSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {searchResults.length > 0 ? 'SEARCH RESULTS' : 'SEARCH FOR USERS TO INVITE'}
          </Text>
          
          {searchResults.map((user) => {
            const isSelected = selectedUsers.some((u) => u.id === user.id);
            return (
              <TouchableOpacity 
                key={user.id} 
                style={[styles.contactCard, { backgroundColor: theme.inputBg }, isSelected && { borderColor: theme.primary, borderWidth: 1 }]}
                onPress={() => toggleUserSelection(user)}
              >
                <Image source={{ uri: user.avatar || 'https://i.pravatar.cc/150?u=' + user.id }} style={styles.contactAvatar} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.text }]}>{user.firstName} {user.lastName}</Text>
                  <Text style={[styles.contactEmail, { color: theme.textSecondary }]}>{user.email}</Text>
                </View>
                <View style={styles.actionContainer}>
                  {isSelected ? (
                    <View style={[styles.actionCheck, { backgroundColor: theme.primary }]}><Feather name="check" size={14} color="#000" /></View>
                  ) : (
                    <View style={[styles.addButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}><Text style={{ color: theme.textSecondary }}>Add</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>


          <View style={{ alignItems: 'center', padding: 20, backgroundColor: theme.background, borderRadius: 16 }}>
    <Text style={{ marginBottom: 15, fontWeight: 'bold' ,color: theme.text }}>Scan to Join Group</Text>
    <QRCode
      value={currentGroup?.inviteCode || "PENDING"} // The exact invite code string from the backend
      size={180}
      color="black"
      backgroundColor="white"
    />
  </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: theme.primary },
            selectedUsers.length === 0 && { opacity: 0.5 }
          ]}
          onPress={handleSendInvites}
          disabled={selectedUsers.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Send {selectedUsers.length} Invitations</Text>
              <Feather name="send" size={18} color="#111" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 10 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },

  capacityCard: { borderRadius: 16, padding: 16, marginBottom: 24 },
  capacityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  capacityLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capacityTitle: { fontSize: 14, fontWeight: '600' },
  capacityText: { fontSize: 12, fontWeight: 'bold' },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 12 },
  progressBarFill: { height: 6, borderRadius: 3 },
  capacityFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capacitySubtext: { fontSize: 11, flex: 1 },

  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  
  selectedSection: { marginBottom: 24 },
  selectedScroll: { overflow: 'visible' },
  selectedUser: { alignItems: 'center', marginRight: 16, width: 60 },
  selectedAvatarContainer: { position: 'relative', marginBottom: 8 },
  selectedAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2 },
  removeIcon: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  selectedName: { fontSize: 11, textAlign: 'center' },

  suggestedSection: { marginBottom: 20 },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 12 },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  contactEmail: { fontSize: 13 },
  
  actionContainer: { justifyContent: 'center', alignItems: 'flex-end', minWidth: 60 },
  addButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  addText: { fontSize: 12, fontWeight: '600' },
  actionCheck: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});