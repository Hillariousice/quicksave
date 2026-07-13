import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, 
  TouchableOpacity, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { timeAgo } from '@/utils/time';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotifications } from '@/store/slices/notificationSlice';



export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useAppDispatch();
  const { items: notifications } = useAppSelector(state => state.notifications);
  console.log('notify:', notifications)
 useEffect(() => {
    dispatch(fetchNotifications());
  }, []);
  const handleNotificationPress = (item: any) => {
    if (item.type === 'PAYOUT_SCHEDULED') {
      router.push({ pathname: '/sub/notification/payout', params: { data: JSON.stringify(item) } });
       } else if (item.type === 'CONTRIBUTION_CONFIRMED') {
      router.push({ pathname: '/sub/notification/contribution', params: { data: JSON.stringify(item) } });
     } else if (item.type === 'NEW_MEMBER') {
      router.push({ pathname: '/sub/notification/new-member', params: { data: JSON.stringify(item) } });
    }
  };

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'PAYOUT_SCHEDULED': return { name: 'bell', color: theme.primary, bg: `${theme.primary}15` };
      case 'CONTRIBUTION_CONFIRMED': return { name: 'check-circle', color: '#34C759', bg: '#34C75915' };
      case 'NEW_MEMBER': return { name: 'user', color: '#4A90E2', bg: '#4A90E215' };
      default: return { name: 'bell', color: theme.textSecondary, bg: theme.inputBg };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Notifications</Text>
        <TouchableOpacity>
          <Text style={[styles.markRead, { color: theme.textSecondary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const iconConfig = getIconConfig(item.type);
          return (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: theme.inputBg }]}
              onPress={() => handleNotificationPress(item)}
            >
              {/* Unread Indicator Bar */}
              {!item.isRead && <View style={[styles.unreadBar, { backgroundColor: theme.primary }]} />}
              
              <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                <Feather name={iconConfig.name as any} size={20} color={iconConfig.color} />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.time, { color: !item.isRead ? theme.primary : theme.textSecondary }]}>
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.message, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  markRead: { fontSize: 12, fontWeight: '500' },
  listContent: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  unreadBar: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold' },
  time: { fontSize: 12, fontWeight: '600' },
  message: { fontSize: 13, lineHeight: 20 },
});