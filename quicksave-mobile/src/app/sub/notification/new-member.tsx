import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function NewMemberDetailScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const notification = data ? JSON.parse(data as string) : {};
  const metadata = notification.metadata || {};
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Group Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* AVATAR WITH BADGE */}
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }} // Fake user avatar
            style={styles.avatar} 
          />
          <View style={styles.waveBadge}>
            <MaterialIcons name="waving-hand" size={14} color="#FFF" />
          </View>
        </View>

        {/* TEXT */}
        <Text style={[styles.userName, { color: theme.text }]}>{metadata.fullName}</Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          {metadata.fullName} has joined the <Text style={{ color: theme.text, fontWeight: 'bold' }}>{metadata.groupName}</Text> group. Welcome {metadata.fullName} to the circle and start saving together!
        </Text>

        {/* GROUP INFO CARD */}
        <View style={[styles.infoCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.groupNameRow}>
            <View style={styles.groupIconBg}>
              <FontAwesome5 name="users" size={14} color="#FFF" />
            </View>
            <View>
              <Text style={styles.infoLabel}>GROUP NAME</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{metadata.groupName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.infoLabel}>CURRENT MEMBERS</Text>
              <View style={styles.membersRow}>
                <Text style={[styles.statValue, { color: theme.text }]}>{metadata.groupMemberCount}</Text>
                <Text style={styles.statMax}>/{metadata.groupTarget}</Text>
                {/* Fake overlapping avatars */}
                <View style={styles.overlapAvatars}>
                  <View style={[styles.miniAvatar, { backgroundColor: '#4A90E2', right: -10, zIndex: 1 }]} />
                  <View style={[styles.miniAvatar, { backgroundColor: '#34C759', right: 0, zIndex: 2 }]} />
                </View>
              </View>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.infoLabel}>NEXT PAYOUT</Text>
              <View style={styles.dateRow}>
                <Feather name="calendar" size={14} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text, marginLeft: 6 }]}>{metadata.nextPayoutDate}</Text>
              </View>
              <Text style={styles.daysLeft}>In {metadata.daysLeft} Days</Text>
            </View>
          </View>
        </View>

        {/* SAVING PROGRESS CARD */}
        <View style={styles.progressCard}>
          <MaterialCommunityIcons name="piggy-bank-outline" size={24} color={theme.primary} style={styles.piggyIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>Saving Progress</Text>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              The group is <Text style={{ color: theme.text, fontWeight: 'bold' }}>{metadata.groupProgress}%</Text> on track for this month's goal.
            </Text>
          </View>
        </View>
      </View>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={()=> router.push(`/sub/messages/group/${notification?.data?.group_id}`)}>
          <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#111" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Say Hello</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.inputBorder }]} onPress={()=> router.push(`/sub/groups/${notification?.data?.group_id}`)}>
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>View Group</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#FF8C00' },
  waveBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF8C00', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },
  
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subText: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  
  infoCard: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 16 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupIconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 10, color: '#9BA1A6', fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1 },
  membersRow: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statMax: { fontSize: 14, color: '#9BA1A6', marginLeft: 2 },
  overlapAvatars: { flexDirection: 'row', marginLeft: 16 },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, position: 'absolute', borderWidth: 1, borderColor: '#121212' },
  
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  daysLeft: { fontSize: 12, color: '#9BA1A6', marginTop: 4 },

  progressCard: { flexDirection: 'row', width: '100%', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  piggyIcon: { marginRight: 12 },
  progressTitle: { fontSize: 14, fontWeight: 'bold', color: '#FF8C00', marginBottom: 4 },
  progressText: { fontSize: 13, lineHeight: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { height: 56, borderRadius: 28, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
});