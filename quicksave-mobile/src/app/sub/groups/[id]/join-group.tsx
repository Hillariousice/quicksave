import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, 
  useColorScheme, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';

export default function JoinGroupScreen() {
  const router = useRouter();
  
  // 👉 Dynamic Light/Dark Mode!
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinGroup = async () => {
    // Remove "QKS-" if they typed it, and clear any spaces
    const cleanCode = inviteCode.replace('QKS-', '').replace(/\s/g, '').trim();

    if (cleanCode.length < 6) {
      setErrorMsg('Please enter a valid invite code.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // Hit the Day 16 Backend Endpoint
      const response = await api.post('/groups/join', { inviteCode: cleanCode });
      
      // Navigate back to the Groups dashboard to see the new group!
      router.replace('/(tabs)/groups');

    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Invalid code or group is full.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Join Group</Text>
          <View style={{ width: 24 }} /> {/* Spacer for centering */}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* ICON & TEXT */}
          <View style={styles.iconWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: '#FF8C0015' }]}>
              <FontAwesome5 name="user-plus" size={32} color={theme.primary} />
            </View>
          </View>

          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            Enter the unique invitation code shared by the group admin to join a savings circle.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* INPUT FIELD */}
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="QKS-0000"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              value={inviteCode}
              onChangeText={setInviteCode}
            />
          </View>

          {/* JOIN BUTTON */}
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              { backgroundColor: theme.primary, opacity: loading || inviteCode.length < 4 ? 0.7 : 1 }
            ]}
            onPress={handleJoinGroup}
            disabled={loading || inviteCode.length < 4}
          >
            {loading ? (
              <ActivityIndicator color="#111" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.primaryButtonText}>Join Group</Text>
                <Feather name="chevron-right" size={18} color="#111" />
              </View>
            )}
          </TouchableOpacity>

          {/* SCAN QR CODE BUTTON (Routes to the scanner we built previously!) */}
          <TouchableOpacity 
            style={[styles.scanButton, { borderColor: theme.inputBorder }]}
            onPress={() => router.push('/sub/groups/scan')}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={18} color={theme.textSecondary} />
            <Text style={[styles.scanText, { color: theme.textSecondary }]}>Scan QR Code</Text>
          </TouchableOpacity>

          {/* BROWSE LINK */}
          <TouchableOpacity style={styles.browseLink}>
            <Text style={[styles.browseText, { color: theme.primary }]}>
              Don't have a code? Browse public groups
            </Text>
            <View style={[styles.linkUnderline, { backgroundColor: theme.primary }]} />
          </TouchableOpacity>

          {/* HOW IT WORKS CARD */}
          <View style={[styles.infoCard, { backgroundColor: theme.inputBg }]}>
            <View style={styles.infoIconBg}>
              <Feather name="info" size={14} color={theme.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>How it works</Text>
              <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
                Joining a group lets you contribute to a shared goal. Your funds stay secure until the group reaches its milestone.
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  
  content: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, alignItems: 'center' },
  
  iconWrapper: { marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  
  instructionText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 20 },
  
  errorBox: { backgroundColor: '#FF3B3020', padding: 12, borderRadius: 8, marginBottom: 20, width: '100%' },
  errorText: { color: '#FF3B30', textAlign: 'center', fontSize: 14, fontWeight: '500' },

  inputContainer: { width: '100%', height: 60, borderRadius: 12, justifyContent: 'center', marginBottom: 24 },
  input: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4 },

  primaryButton: { width: '100%', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },

  scanButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  scanText: { fontSize: 14, fontWeight: '600' },

  browseLink: { marginBottom: 40, alignItems: 'center' },
  browseText: { fontSize: 12, fontWeight: '600' },
  linkUnderline: { height: 1, width: '100%', marginTop: 2, opacity: 0.5 },

  infoCard: { flexDirection: 'row', width: '100%', padding: 16, borderRadius: 16, gap: 12 },
  infoIconBg: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FF8C0015', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  infoDesc: { fontSize: 12, lineHeight: 18 },
});