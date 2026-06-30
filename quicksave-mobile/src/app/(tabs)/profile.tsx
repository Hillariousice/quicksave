import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useColorScheme, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome5, Feather } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { logout } from '@/store/slices/authSlice';
import { api } from '@/api/client';
import { UserService } from '@/api/services/user.service';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [stats, setStats] = useState({ totalSaved: 0, totalReceived: 0, groupCount: 0 });
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    UserService.getStats().then(setStats).catch(console.error);
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (refreshToken) await api.post('/auth/logout', { refreshToken });
          } catch (e) { console.error("Logout API failed", e); }
          
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          dispatch(logout());
          router.replace('/auth/login');
        }
      }
    ]);
  };

  const MenuItem = ({ icon, title, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.inputBg, borderBottomColor: theme.background }]} onPress={onPress}>
      <Feather name={icon} size={20} color={isDestructive ? '#FF3B30' : theme.textSecondary} style={{ width: 30 }} />
      <Text style={[styles.menuTitle, { color: isDestructive ? '#FF3B30' : theme.text }]}>{title}</Text>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
          <Text style={[styles.logoText, { color: theme.primary }]}>QUICKSAVE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* USER INFO */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Feather name="edit-2" size={10} color="#111" />
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.firstName || 'Hillary'} {user?.lastName || 'Okporka'}</Text>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{user?.phone || '+234 812 345 6789'}</Text>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL SAVED</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stats.totalSaved?.toLocaleString()}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL RCVD</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalReceived?.toLocaleString()}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>GROUPS</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.groupCount?.toLocaleString()}</Text>
          </View>
        </View>

        {/* MENU LIST */}
        <View style={[styles.menuContainer, { backgroundColor: theme.inputBg }]}>
          <MenuItem icon="user" title="Edit Profile" onPress={() => router.push('/sub/profile/edit')} />
          <MenuItem icon="home" title="Bank Account" onPress={() => router.push('/sub/profile/banks')} />
          <MenuItem icon="lock" title="Security" onPress={() => router.push('/sub/profile/security')} />
          <MenuItem icon="bell" title="Notifications" onPress={() => router.push('/sub/notification')} />
          {/* <MenuItem icon="settings" title="App Settings" onPress={() => console.log('Settings')} /> */}
          <MenuItem icon="help-circle" title="Help & Support" onPress={() => router.push('/sub/profile/help-support')} />
          <MenuItem icon="log-out" title="Logout" isDestructive onPress={handleLogout} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  userInfoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userPhone: { fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 'bold' },

  menuContainer: { borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1 },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '500' },
});