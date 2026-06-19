import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function ContributionDetailScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const notification = data ? JSON.parse(data as string) : {};
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(notification.metadata?.amount || 50000).replace('.00', '');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Contribution Success</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* SUCCESS ICON */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlow, { backgroundColor: '#34C75915' }]}>
            <MaterialCommunityIcons name="check-circle" size={48} color="#34C759" />
          </View>
        </View>

        {/* TEXT */}
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          Your contribution for this cycle has been confirmed.
        </Text>
        <Text style={[styles.amountText, { color: theme.text }]}>{amount}</Text>

        {/* TRANSACTION DETAILS CARD */}
        <View style={[styles.infoCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>TRANSACTION DETAILS</Text>
            <Feather name="file-text" size={14} color="#9BA1A6" />
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Group</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>Tech Founders XI</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>#QS-99823</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <View style={styles.walletMethod}>
              <FontAwesome5 name="wallet" size={12} color={theme.primary} />
              <Text style={[styles.detailValue, { color: theme.text, marginLeft: 6 }]}>Wallet Balance</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.receiptButton}>
            <Feather name="list" size={16} color={theme.text} />
            <Text style={[styles.receiptText, { color: theme.text }]}>View Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* INSIGHT CARD */}
        <View style={[styles.insightCard, { backgroundColor: '#FF8C0010', borderColor: '#FF8C0030', borderWidth: 1 }]}>
          <Text style={styles.insightTitle}>QUICKSAVE INSIGHT</Text>
          <Text style={[styles.insightText, { color: theme.text }]}>
            You are <Text style={{ color: theme.primary, fontWeight: 'bold' }}>80%</Text> through this savings circle!
          </Text>
        </View>
      </View>

      {/* FOOTER ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.primaryButtonText}>Back to Groups →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  iconWrapper: { marginBottom: 16 },
  iconGlow: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  
  subText: { fontSize: 14, textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  amountText: { fontSize: 48, fontWeight: 'bold', marginBottom: 32 },
  
  infoCard: { width: '100%', borderRadius: 16, padding: 20, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#9BA1A6', letterSpacing: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailLabel: { fontSize: 14, color: '#9BA1A6' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  walletMethod: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  receiptButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  receiptText: { fontSize: 14, fontWeight: '600' },

  insightCard: { width: '100%', borderRadius: 12, padding: 16 },
  insightTitle: { fontSize: 10, fontWeight: 'bold', color: '#FF8C00', letterSpacing: 1, marginBottom: 8 },
  insightText: { fontSize: 14, lineHeight: 20 },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});