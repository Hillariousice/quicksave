import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, ActivityIndicator, useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { GroupService } from '@/api/services/group.service';


export default function RotationTimelineScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const currentUser = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);
        const [details, rotationData] = await Promise.all([
          GroupService.getGroupById(groupId as string),
          GroupService.getRotationTimeline(groupId as string)
        ]);
        
        setGroupInfo(details);
        setTimeline(rotationData);
      } catch (error) {
        console.error("Failed to load timeline", error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) loadTimeline();
  }, [groupId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
      .format(amount).replace('.00', '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleGenerateRotation = () => {
    if (groupInfo.members.length < 2) {
      Alert.alert("Cannot Start", "You need at least 2 members to generate a rotation.");
      return;
    }

    Alert.alert(
      "Generate Rotation",
      "How would you like to order the payouts?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Random Order", onPress: () => triggerApi('RANDOM') },
        { text: "By Join Date", onPress: () => triggerApi('JOIN_ORDER') },
      ]
    );
  };

  const triggerApi = async (mode: 'RANDOM' | 'JOIN_ORDER') => {
    setGenerating(true);
    try {
      await GroupService.generateRotation(groupId as string, {
        mode,
        startDate: new Date().toISOString() // Start from today
      });
      Alert.alert("Success", "Rotation generated successfully!");
      loadTimeline(); // Refresh the screen data
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to generate rotation");
    } finally {
      setGenerating(false);
    }
  };

  // 3. Permission Check: Is the logged-in user the one who created the group?
  const isGroupAdmin = currentUser?.id === groupInfo?.creatorId;

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
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.primary }]}>QUICKSAVE</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={()=> router.push('/sub/notification')}>
          <Feather name="bell" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TITLES */}
        <View style={styles.titleContainer}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Rotation Timeline</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{groupInfo?.name || 'Loading group...'}</Text>
        </View>

        {/* TIMELINE LIST */}
         <View style={styles.timelineContainer}>
          {timeline.length === 0 ? (
            // <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
            //   Rotation hasn't been generated yet.
            // </Text>
            <View style={styles.emptyState}>
              <Feather name="layers" size={50} color={theme.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={{ textAlign: 'center', color: theme.textSecondary, fontSize: 16 }}>
                Rotation hasn't been generated yet.
              </Text>
              
              {/* 4. Show Generate Button only to ADMIN */}
              {isGroupAdmin ? (
                <TouchableOpacity 
                  style={[styles.generateBtn, { backgroundColor: theme.primary }]}
                  onPress={handleGenerateRotation}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <FontAwesome5 name="magic" size={14} color="#000" />
                      <Text style={styles.generateBtnText}>Setup & Start Rotation</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 12 }}>
                  Waiting for the group admin to start the cycle.
                </Text>
              )}
            </View>
          ) : (
            timeline.map((item, index) => {
              const isLast = index === timeline.length - 1;
              const isPast = item.status === 'PAID';
              const isCurrent = item.status === 'PROCESSING';
              const isFuture = item.status === 'PENDING';

              const cardBg = isCurrent ? (colorScheme === 'dark' ? '#2A1C0F' : '#FFF3E0') : (colorScheme === 'dark' ? theme.inputBg : '#F9FAFB');
              const cardBorder = isCurrent ? theme.primary : (isFuture ? theme.inputBorder : 'transparent');
              const textColor = isFuture ? theme.textSecondary : theme.text;
              const amountColor = isCurrent ? theme.primary : (isFuture ? theme.textSecondary : theme.text);

              return (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.graphicColumn}>
                    {isPast ? (
                      <View style={[styles.iconCompleted, { backgroundColor: theme.primary }]}>
                        <FontAwesome5 name="check" size={10} color="#111" />
                      </View>
                    ) : isCurrent ? (
                      <View style={[styles.iconCurrentRing, { borderColor: theme.primary }]}>
                        <View style={[styles.iconCurrentDot, { backgroundColor: theme.primary }]} />
                      </View>
                    ) : (
                      <View style={[styles.iconFuture, { backgroundColor: theme.inputBorder }]} />
                    )}
                    {!isLast && <View style={[styles.connectingLine, { backgroundColor: theme.inputBorder }]} />}
                  </View>

                  <View style={styles.cardColumn}>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isFuture && { borderStyle: 'dashed' }]}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cycleText, { color: isCurrent ? theme.primary : theme.textSecondary }]}>
                          SLOT {item.position}
                        </Text>
                        {isCurrent && (
                          <View style={styles.processingBadge}>
                            <Text style={styles.processingText}>PROCESSING</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.dateRow}>
                        <Feather name="calendar" size={12} color={textColor} />
                        <Text style={[styles.dateText, { color: textColor }]}>
                          {formatDate(item.expectedPayoutDate)}
                        </Text>
                      </View>

                      <Text style={[styles.nameText, { color: textColor }, isPast && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                        {item.user?.firstName} {item.user?.lastName}
                      </Text>

                      <Text style={[styles.amountText, { color: amountColor }]}>
                        {formatCurrency(groupInfo?.contributionAmount * timeline.length)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  logoContainer: { alignItems: 'center' },
  logoText: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },

  scrollContent: { paddingBottom: 100 },

  // Titles
  titleContainer: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  pageSubtitle: { fontSize: 14 },

  // Timeline Layout
  timelineContainer: { paddingHorizontal: 24 },
  timelineRow: { flexDirection: 'row', marginBottom: 20, minHeight: 120 },
  
  // Graphic Column (Icons & Lines)
  graphicColumn: { width: 40, alignItems: 'center', paddingTop: 30 },
  
  iconCompleted: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  iconCurrentRing: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: '#000' },
  iconCurrentDot: { width: 14, height: 14, borderRadius: 7 },
  iconFuture: { width: 12, height: 12, borderRadius: 6, zIndex: 2, marginTop: 6 },
  
  connectingLine: { position: 'absolute', top: 54, bottom: -10, width: 2, zIndex: 1 },

  // Card Column
  cardColumn: { flex: 1, paddingLeft: 16 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  cardDashed: { borderStyle: 'dashed' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cycleText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  processingBadge: { backgroundColor: '#FF8C0030', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  processingText: { color: '#FF8C00', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dateText: { fontSize: 13, fontWeight: '500' },
  
  nameText: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  amountText: { fontSize: 14, fontWeight: '600' },
   emptyState: { 
    marginTop: 60, 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  generateBtn: { 
    marginTop: 24, 
    flexDirection: 'row', 
    height: 56, 
    width: '100%', 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  generateBtnText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});