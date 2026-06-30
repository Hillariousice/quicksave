import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { WalletService } from '@/api/services/wallet.service';

export default function TransactionReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(txData.amount || 10000);
  const receiptRef = useRef<View>(null);

  useEffect(() => {
    if (id) {
      WalletService.getTransactionById(id as string)
        .then(setTx)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <ActivityIndicator />;
  // 👉 NEW: Logic to save the receipt to the phone's gallery
  const handleDownload = async () => {
    try {
      // 1. Request permission to save to the user's photo gallery
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to save the receipt to your photos.');
        return;
      }

      // 2. Take a high-quality snapshot of the receipt card
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
      });

      // 3. Save it to the gallery!
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Receipt saved to your photos! 📸');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save the receipt.');
    }
  };

  // 👉 NEW: Logic to open the native iOS/Android sharing menu
  const handleShare = async () => {
    try {
      // 1. Take the snapshot
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
      });

      // 2. Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      // 3. Open the native share dialog (WhatsApp, iMessage, Email, etc.)
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Quicksave Transaction Receipt',
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to share the receipt.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>Transaction Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        
        {/* CARD CONTAINER */}
        <View ref={receiptRef} style={[styles.receiptCard, { backgroundColor: theme.inputBg }]} collapsable={false}>
          
          <View style={styles.iconWrapper}>
            <View style={[styles.iconGlow, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons name="check-circle" size={40} color={theme.primary} />
            </View>
          </View>

          <Text style={[styles.successTitle, { color: theme.primary }]}>TRANSACTION SUCCESSFUL</Text>
          <Text style={[styles.amountText, { color: theme.text }]}>{tx.amount.toLocaleString()}</Text>

          {/* DETAILS */}
          <View style={{ width: '100%', marginTop: 20 }}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Type</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tx.type || 'Contribution'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Group Name</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tx.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tx.createAt}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.detailValue, { color: theme.text, marginRight: 6 }]}>
                  {tx.reference || 'QS-7729103-AC'}
                </Text>
                <Feather name="copy" size={12} color={theme.textSecondary} />
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="wallet" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.detailValue, { color: theme.text }]}>QS Wallet</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{tx.status}</Text>
              </View>
            </View>
          </View>

          <Feather name="chevron-down" size={16} color={theme.textSecondary} style={{ marginVertical: 20 }} />
          
          <Text style={[styles.securityNote, { color: theme.textSecondary }]}>
            <Feather name="shield" size={10} /> SECURE TRANSACTION BY QUICKSAVE ENGINE
          </Text>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleDownload}>
          <Feather name="download" size={18} color="#111" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.background, borderColor: theme.inputBorder }]} onPress={handleShare}>
          <Feather name="share-2" size={18} color={theme.text} style={{ marginRight: 8 }} />
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Share Receipt</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  
  receiptCard: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  iconWrapper: { marginBottom: 16 },
  iconGlow: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  
  successTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  amountText: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailLabel: { fontSize: 13, color: '#9BA1A6' },
  detailValue: { fontSize: 13, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C75915', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  statusText: { color: '#34C759', fontSize: 12, fontWeight: 'bold' },

  securityNote: { textAlign: 'center', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

  primaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: 'bold' },
});