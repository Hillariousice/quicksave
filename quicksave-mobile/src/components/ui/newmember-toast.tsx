import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Platform, useColorScheme, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { socketService } from '@/api/services/socket.service';
import { useAppDispatch } from '@/store';
import { memberJoinedRealtime } from '@/store/slices/groupSlice';

export default function NewMemberToast() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useAppDispatch();
  
  const [toastData, setToastData] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const hideToast = () => {
    Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }).start(() => setToastData(null));
  };

  useEffect(() => {
    const handleNewMember = (data: any) => {
      setToastData(data);
      
      // 1. Instantly update Redux so the counters tick up!
      dispatch(memberJoinedRealtime(data));
      
      // 2. Slide the toast down
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 12 }).start();

      // 3. Auto-hide after 5 seconds
      setTimeout(hideToast, 5000);
    };

    socketService.onMemberJoined(handleNewMember);
    return () => socketService.offMemberJoined(handleNewMember);
  }, [slideAnim, dispatch]);

  if (!toastData) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <SafeAreaView>
        <View style={[styles.toast, { backgroundColor: theme.inputBg, borderColor: '#4A90E2' }]}>
          
          {/* Avatar / Icon */}
          <View style={[styles.iconBg, { backgroundColor: '#4A90E220' }]}>
            {toastData.member?.avatar ? (
              <Image source={{ uri: toastData.member.avatar }} style={styles.avatar} />
            ) : (
              <Feather name="user-plus" size={20} color="#4A90E2" />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>New Group Member! 👋</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {toastData.member?.firstName || 'Someone'} just joined <Text style={{ color: theme.text, fontWeight: 'bold' }}>{toastData.groupName}</Text>.
            </Text>
          </View>

          {/* Dismissible X button */}
          <TouchableOpacity onPress={hideToast} style={{ padding: 4 }}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, paddingHorizontal: 16 },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: Platform.OS === 'android' ? 40 : 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  iconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  textContainer: { flex: 1, paddingRight: 8 },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18 },
});