import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { api } from '@/api/client';

export default function ScanToJoinScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Handle Permissions
  if (!permission) {
    return <View style={styles.container} />; // Loading state
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 2. Handle the actual Scan
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevent scanning the same code 50 times a second
    setScanned(true); 
    setLoading(true);

    try {
      // In a production app, your QR code might contain a deep link like "quicksave://join?code=A7F93B2C"
      // Or it might just be the raw 8-character string "A7F93B2C".
      // We will extract just the code if it's a deep link, or use the raw string.
      const inviteCode = data.includes('code=') ? data.split('code=')[1] : data;

      // Hit your Day 16 Backend Endpoint!
      const response = await api.post('/groups/join', { inviteCode });
      
      Alert.alert('Success!', response.data.message, [
        { text: 'View Group', onPress: () => router.replace('/(tabs)/groups') }
      ]);

    } catch (error: any) {
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Invalid QR Code.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }] // Let them scan again
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan to Join</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CAMERA VIEW */}
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // We only care about QR codes
        }}
      />

      {/* UI OVERLAY (The square targeting box) */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedBox}>
            {loading && <ActivityIndicator size="large" color="#FF8C00" />}
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.overlayText}>Align the QR code within the frame</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: { textAlign: 'center', color: '#FFF', marginBottom: 20 },
  permissionButton: { backgroundColor: '#FF8C00', padding: 15, borderRadius: 10, alignSelf: 'center' },
  permissionText: { color: '#000', fontWeight: 'bold' },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, 
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10 
  },
  backButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Overlay styles to create the "scanner cutout" effect
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#FF8C00', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  overlayText: { color: '#FFF', textAlign: 'center', marginTop: 30, fontSize: 16, fontWeight: '600' }
});