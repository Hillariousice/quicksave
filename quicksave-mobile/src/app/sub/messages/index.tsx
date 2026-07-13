import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { useAppDispatch, useAppSelector } from '@/store';
import api, { ChatService } from '@/api/services/chat.service';
import { markLocalAsRead, setConversations } from '@/store/slices/chatSlice';



export default function MessagesListScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { conversations, loading } = useAppSelector(state => state.chat);
const [searchQuery, setSearchQuery] = useState('');
 

  // 1. Search Filtering
  const filteredConversations = conversations.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAllRead = async () => {
    try {
      await api.post('/chats/mark-all-read'); // Call backend
      dispatch(markLocalAsRead()); // Update Redux UI
    } catch (e) { console.error(e); }
  };

    useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await ChatService.getConversations();
        dispatch(setConversations(data));
      } catch (error) {
        console.error("Failed to load chats", error);
      }
    };
    loadConversations();
  }, []);

  const renderIcon = (item: any) => {
    if (item.isGroup) return <FontAwesome5 name="users" size={18} color={theme.textSecondary} />;
    if (item.isSupport) return <MaterialIcons name="support-agent" size={20} color={theme.textSecondary} />;
    return <Image source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }} style={styles.avatar} />;
  };

  
  const formatTime = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.primary, marginLeft: 16 }]}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="more-vertical" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
        <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput 
          style={[styles.searchInput, { color: theme.text }]} 
          placeholder="Search conversations..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.recentText, { color: theme.textSecondary }]}>RECENT</Text>
        <TouchableOpacity onPress={handleMarkAllRead}><Text style={[styles.markRead, { color: theme.primary }]}>Mark all as read</Text></TouchableOpacity>
      </View>

      {/* CHAT LIST */}
       {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.chatRow}  
              onPress={() => item.isSupport ? router.push('/sub/messages/support') : router.push(`/sub/messages/group/${item.id}`)}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatarBg, { backgroundColor: theme.inputBg }]}>
                  {renderIcon(item)}
                </View>
                {item.unread > 0 && <View style={[styles.unreadDot, { backgroundColor: theme.primary, borderColor: theme.background }]} />}
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.chatTime, { color: item.unread > 0 ? theme.text : theme.textSecondary }]}>
                    {formatTime(item.time)}
                  </Text>
                </View>
                <View style={styles.chatPreviewRow}>
                  <Text style={[styles.chatPreview, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.text}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]}>
        <MaterialIcons name="message" size={24} color="#111" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, marginHorizontal: 24, marginBottom: 20, paddingHorizontal: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  recentText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  markRead: { fontSize: 12, fontWeight: '600' },

  chatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  unreadDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },

  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: '600' },
  chatTime: { fontSize: 12 },
  chatPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { flex: 1, fontSize: 14, marginRight: 10 },
  unreadBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  unreadText: { color: '#111', fontSize: 10, fontWeight: 'bold' },

  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});