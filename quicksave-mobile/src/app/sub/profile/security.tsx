import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/api/client';

export default function SecurityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [biometrics, setBiometrics] = useState(true);
  const [faceId, setFaceId] = useState(true);
  const [pinLogin, setPinLogin] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);


    useEffect(() => {
    SecureStore.getItemAsync('biometricsEnabled').then(val => {
      const isEnabled = val === 'true';
      setBiometrics(isEnabled);
      setFaceId(isEnabled);
    });
    fetchActiveSessions();
  }, []);

   const fetchActiveSessions = async () => {
  setLoadingSessions(true);
  try {
    const res = await api.get('/auth/sessions'); // Hits the new endpoint
    setSessions(res.data.data);
  } catch (error) {
    console.error("Failed to fetch sessions", error);
  } finally {
    setLoadingSessions(false);
  }
};
   const handleLogoutAll = async () => {
  Alert.alert("Are you sure?", "You will be logged out of all other devices.", [
    { text: "Cancel" },
    { 
      text: "Logout Others", 
      style: "destructive", 
      onPress: async () => {
         await api.delete('/auth/sessions/all');
         fetchActiveSessions(); // Refresh list
      }
    }
  ]);
};

  const handleToggleBiometrics = async (value: boolean) => {
    setBiometrics(value);
    await SecureStore.setItemAsync('biometricsEnabled', value ? 'true' : 'false');
  };
   const handleFaceIdToggle = async (value: boolean) => {
    setFaceId(value);
    await SecureStore.setItemAsync('biometricsEnabled', value ? 'true' : 'false');
  };
    const handleTogglePin = async (value: boolean) => {
    setPinLogin(value);
    // You would connect to your backend here to disable the PIN
    // await api.post('/security/disable-pin', { pin });
  };
  
  const SettingRow = ({ icon, label, hasSwitch, value, onValueChange, onPress, rightText, isExpanded }: any) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={hasSwitch}>
      <View style={styles.settingLeft}>
        <Feather name={icon} size={18} color={theme.primary} style={styles.settingIcon} />
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {hasSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.inputBorder, true: theme.primary }}
          thumbColor="#FFF"
        />
      ) : (
        <View style={styles.settingRight}>
          {rightText && <Text style={[styles.rightText, { color: theme.textSecondary }]}>{rightText}</Text>}
          <Feather 
            name={isExpanded ? "chevron-down" : "chevron-right"} 
            size={18} 
            color={theme.textSecondary} 
          />
        </View>
      )}
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>AUTHENTICATION</Text>
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          <SettingRow icon="fingerprint" label="Biometric Login" hasSwitch value={biometrics} onValueChange={handleToggleBiometrics} />
          <View style={styles.divider} />
          <SettingRow icon="smile" label="Face ID" hasSwitch value={faceId} onValueChange={handleFaceIdToggle} />
          <View style={styles.divider} />
          <SettingRow icon="grid" label="PIN Login" hasSwitch value={pinLogin} onValueChange={handleTogglePin} />
          <View style={styles.divider} />
          <SettingRow 
            icon="shield" 
            label="Two-Factor Authentication" 
            hasSwitch={!twoFactor} // Turn into a button if they need to set it up
            value={twoFactor} 
            onValueChange={setTwoFactor} 
            onPress={() => router.push('/sub/profile/setup')} 
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>ACCESS</Text>
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          {/* 👉 ROUTES TO CHANGE PASSWORD SCREEN */}
          <SettingRow icon="lock" label="Change Password" onPress={() => router.push('/sub/profile/change-password')} />
          <View style={styles.divider} />
          <SettingRow 
            icon="monitor" 
            label="Active Sessions" 
            rightText={`${sessions.length} devices`} 
            isExpanded={isSessionsExpanded}
            onPress={() => setIsSessionsExpanded(!isSessionsExpanded)} 
          />
          
          {isSessionsExpanded && (
            <View style={styles.sessionDropdown}>
              {loadingSessions ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                sessions.map((item: any, index: any) => (
                  <View key={item.id} style={[styles.sessionItem, index === 0 && { borderTopWidth: 0 }]}>
                    <MaterialCommunityIcons 
                      name={item.device.includes('iPhone') ? "cellphone" : "laptop"} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.sessionDevice, { color: theme.text }]}>
                        {item.device} {item.current && <Text style={{ color: theme.primary }}>(This device)</Text>}
                      </Text>
                      <Text style={[styles.sessionDetails, { color: theme.textSecondary }]}>
                        {item.location} • {item.lastActive}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
            </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>DANGER ZONE</Text>
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogoutAll}>
            <Feather name="log-out" size={18} color="#FF3B30" />
            <Text style={styles.dangerText}>Log out all devices</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.dangerHint, { color: theme.textSecondary }]}>
          This will immediately revoke access to your account on all devices except this one.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  inputText: { flex: 1, fontSize: 16, fontWeight: '500' },
  input: { flex: 1, fontSize: 16 },
  
  resolvedContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resolvedText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  card: { borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 24 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightText: { fontSize: 12 },
  divider: { height: 1, backgroundColor: '#333', opacity: 0.5 },
  
  dangerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  dangerText: { color: '#FF3B30', fontSize: 15, fontWeight: 'bold' },
  dangerHint: { textAlign: 'center', fontSize: 11, marginTop: 12, paddingHorizontal: 20 },

  requirementsBox: { marginTop: 24 },
  reqTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkText: { fontSize: 13 },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});