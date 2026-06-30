import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ScrollView, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMessages, receiveMessage } from '@/store/slices/chatSlice';
import { io } from 'socket.io-client';
import { ChatService } from '@/api/services/chat.service';


export default function SupportChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
 const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const messages = useAppSelector(state => state.chat.messages);
  const [text, setText] = useState('');
   const [isTyping, setIsTyping] = useState(false);

  // For support, we use a unique ID based on the user's ID or a fixed constant
  const supportRoomId = `SUPPORT_${user.id}`;

  useEffect(() => {
    dispatch(fetchMessages(supportRoomId));

    const socket = io(process.env.EXPO_PUBLIC_API_URL);
    socket.emit('join_group', supportRoomId);

    socket.on('new_message', (msg) => {
      if (msg.senderId !== user.id) {
        dispatch(receiveMessage(msg));
      }
    });

    socket.on('typing', (data) => {
      if (data.isSupport) setIsTyping(data.typing);
    });

    return () => { socket.disconnect(); };
  }, [supportRoomId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    // Optimistic Update
    const tempMsg = { 
      id: Date.now().toString(),
      content: text, 
      senderId: user.id, 
      type: 'sent', 
      createdAt: new Date().toISOString(),
      sender: { firstName: 'You' }
    };
    
    dispatch(receiveMessage(tempMsg));
    const messageToSend = text;
    setText('');

    await ChatService.sendMessage(supportRoomId, messageToSend);
  };

  const formatTime = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>Ignite Wealth Support</Text>
            <View style={styles.activeRow}>
              <View style={styles.activeDotGreen} />
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Always active</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerIcon}><Feather name="more-vertical" size={20} color={theme.textSecondary} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.dateSeparator}>
            <View style={[styles.dateBadge, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>TODAY</Text>
            </View>
          </View>

          {/* CHAT MESSAGES */}
         {messages.map((msg) => {
            const isSent = msg.senderId === user.id;
            return (
              <View key={msg.id} style={[styles.messageRow, isSent ? styles.messageRowSent : styles.messageRowReceived]}>
                
                {!isSent && (
                  <View style={[styles.botAvatar, { backgroundColor: theme.primary }]}>
                    <FontAwesome5 name="robot" size={14} color="#111" />
                  </View>
                )}
                
                <View style={[styles.messageContent, isSent ? styles.messageContentSent : styles.messageContentReceived]}>
                  {!isSent && <Text style={[styles.senderName, { color: theme.textSecondary }]}>{msg.sender}</Text>}
                  <View style={[
                    styles.bubble, 
                    isSent ? [styles.bubbleSent, { backgroundColor: theme.primary }] : [styles.bubbleReceived, { backgroundColor: theme.inputBg }]
                  ]}>
                    <Text style={[styles.messageText, { color: isSent ? '#111' : theme.text }]}>{msg.text}</Text>
                  </View>
                  <Text style={[styles.timeText, { color: theme.textSecondary, textAlign: isSent ? 'right' : 'left' }]}>{msg.time}</Text>
                </View>
              </View>
            );
          })}

          {/* TYPING INDICATOR */}
           {isTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.botAvatar, { backgroundColor: theme.inputBg }]}>
                <FontAwesome5 name="robot" size={14} color={theme.textSecondary} />
              </View>
              <View style={[styles.bubble, styles.bubbleReceived, { backgroundColor: theme.inputBg, width: 50 }]}>
                <Text style={{ color: theme.textSecondary }}>...</Text>
              </View>
            </View>
          )}

        </ScrollView>

        {/* INPUT AREA */}
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.inputBorder }]}>
          <TouchableOpacity style={[styles.attachButton, { backgroundColor: theme.inputBg }]}>
            <Feather name="plus" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.textInputWrapper, { backgroundColor: theme.inputBg }]}>
            <TextInput 
              style={[styles.textInput, { color: theme.text }]} 
              placeholder="Type your message..." 
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Feather name="smile" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary, opacity: text ? 1 : 0.7 }]} onPress={handleSend}>
            <Feather name="send" size={18} color="#111" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... styles below

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