import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMessages, receiveMessage } from '@/store/slices/chatSlice';
import { ChatService } from '@/api/services/chat.service';
import { io } from 'socket.io-client';
import { getDayLabel } from '@/utils/date-helper';

export default function GroupChatScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
 const user = useAppSelector(state => state.auth.user);
  const messages = useAppSelector(state => state.chat.messages);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

   const { currentGroup } = useAppSelector(state => state.groups);
  
     const filteredMessages = messages.filter((m: any) => 
    m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessages = () => {
    let lastDate = '';
    const items: any[] = [];

    filteredMessages.forEach((msg: any) => {
      const dateLabel = getDayLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        items.push({ type: 'date_separator', label: dateLabel, id: `sep-${msg.id}` });
        lastDate = dateLabel;
      }
      items.push(msg);
    });
    return items;
  };

  useEffect(() => {
    // 1. Fetch History
    dispatch(fetchMessages(groupId as string));

    // 2. Connect to Socket
    const socket = io(process.env.EXPO_PUBLIC_API_URL);
    socket.emit('join_group', groupId);

    socket.on('new_message', (msg) => {
      if (msg.senderId !== user.id) { // Don't duplicate own messages
        dispatch(receiveMessage(msg));
      }
    });

    return () => { socket.disconnect(); };
  }, [groupId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const tempMsg = { content: text, senderId: user?.id, type: 'TEXT', createdAt: new Date().toISOString() };
    dispatch(receiveMessage(tempMsg));
    setText('');
    await ChatService.sendMessage(groupId as string, text);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
         {!isSearching ? (
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{currentGroup?.name}</Text>
            </View>
          ) : (
            <TextInput 
              style={{ flex: 1, color: theme.text, marginLeft: 10 }} 
              placeholder="Search messages..." 
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          )}

         <TouchableOpacity onPress={() => { setIsSearching(!isSearching); setSearchQuery(''); }}>
            <Feather name={isSearching ? "x" : "search"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          {/* <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}><Feather name="search" size={20} color={theme.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}><Feather name="more-vertical" size={20} color={theme.textSecondary} /></TouchableOpacity>
          </View> */}
        </View>

        <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          
        {renderMessages().map((item: any) => {
            if (item.type === 'date_separator') {
              return (
                <View key={item.id} style={styles.dateSeparator}>
                  <View style={[styles.dateBadge, { backgroundColor: theme.inputBg }]}><Text style={styles.dateText}>{item.label}</Text></View>
                </View>
              );
            }

            const isSent = item.senderId === user?.id;
            return (
              <View key={item.id} style={[styles.messageRow, isSent ? styles.messageRowSent : styles.messageRowReceived]}>
                <View style={[styles.bubble, isSent ? [styles.bubbleSent, { backgroundColor: theme.primary }] : [styles.bubbleReceived, { backgroundColor: theme.inputBg }]]}>
                  {/* FIX: Use item.content, not item.text */}
                  <Text style={{ color: isSent ? '#000' : theme.text }}>{item.content}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.encryptionNote}>
            <Feather name="lock" size={10} color={theme.textSecondary} />
            <Text style={[styles.encryptionText, { color: theme.textSecondary }]}>Messages are secured with QuickSave Vault encryption.</Text>
          </View>

        </ScrollView>

        {/* INPUT AREA */}
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.inputBorder }]}>
          <TouchableOpacity style={[styles.attachButton, { backgroundColor: theme.inputBg }]}>
            <Feather name="plus" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.textInputWrapper, { backgroundColor: theme.inputBg }]}>
            <TextInput 
              style={[styles.textInput, { color: theme.text }]} 
              placeholder="Send a message..." 
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Feather name="smile" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary, opacity: text ? 1 : 0.7 }]} onPress={handleSend} disabled={!text.trim()}>
            <Feather name="send" size={18} color="#111" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerIcon: { padding: 5 },
  headerTitleContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 16 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  activeDotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },

  chatScroll: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  
  dateSeparator: { alignItems: 'center', marginVertical: 20 },
  dateBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  dateText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  systemMessageContainer: { alignItems: 'center', marginVertical: 16 },
  systemMessage: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  systemText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageRowSent: { justifyContent: 'flex-end' },
  messageRowReceived: { justifyContent: 'flex-start' },
  
  avatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 8 },
  botAvatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  
  messageContent: { maxWidth: '75%' },
  messageContentSent: { alignItems: 'flex-end' },
  messageContentReceived: { alignItems: 'flex-start' },
  
  senderName: { fontSize: 11, marginBottom: 4, marginLeft: 4 },
  
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleSent: { borderBottomRightRadius: 4 },
  bubbleReceived: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  timeText: { fontSize: 10 },

  encryptionNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40, marginBottom: 20 },
  encryptionText: { fontSize: 10 },

  typingContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  typingText: { fontSize: 11, marginBottom: 4, marginLeft: 4 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  attachButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingLeft: 16, paddingRight: 8, minHeight: 48 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingTop: 12, paddingBottom: 12 },
  emojiButton: { padding: 8 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
});