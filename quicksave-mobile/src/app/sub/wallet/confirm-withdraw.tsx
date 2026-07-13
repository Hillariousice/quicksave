import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function WithdrawConfirmScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const txData = data ? JSON.parse(data as string) : {};
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const amount = new Intl.NumberFormat('en-NG').format(txData.amount || 50000);
  
  

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        
        {/* ICON */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlow, { backgroundColor: theme.primary + '20' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={50} color={theme.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Withdrawal Initiated</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your request to withdraw <Text style={{ color: theme.primary }}>₦{amount}</Text> to {txData.receiverBank} is being processed. Funds should arrive within 24 hours.
        </Text>

        {/* SUMMARY CARD */}
        <View style={[styles.summaryCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>TRANSACTION SUMMARY</Text>
            <Feather name="file-text" size={14} color="#9BA1A6" />
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{txData.createdAt}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.detailValue, { color: theme.text, marginRight: 6 }]}>{txData.refNo}</Text>
              <Feather name="copy" size={12} color={theme.textSecondary} />
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.detailValue, { color: theme.text }]}>{txData.receiverBank}</Text>
              <Text style={styles.detailLabel}>{txData.receiverAccount}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{txData.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* FOOTER BUTTONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => router.replace('/(tabs)/savings')}>
          <Text style={styles.primaryButtonText}>Back to Wallet</Text>
          <Feather name="external-link" size={16} color="#111" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        
        {/* 👉 Routes to the universal receipt screen! */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/sub/wallet/transaction-receipt', params: { data: JSON.stringify(txData) }})}>
          <Feather name="download" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>View Transaction Receipt</Text>
        </TouchableOpacity>

        <Text style={[styles.securityNote, { color: theme.textSecondary }]}>
          <Feather name="shield" size={10} /> Secure Transaction by Quicksave Engine
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 60 },
  iconWrapper: { marginBottom: 24 },
  iconGlow: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40, paddingHorizontal: 10 },
  
  summaryCard: { width: '100%', borderRadius: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 10, fontWeight: 'bold', color: '#9BA1A6', letterSpacing: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailLabel: { fontSize: 13, color: '#9BA1A6' },
  detailValue: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF8C0015', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF8C00' },
  statusText: { color: '#FF8C00', fontSize: 12, fontWeight: 'bold' },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { flexDirection: 'row', height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  secondaryButtonText: { fontSize: 14, fontWeight: '600' },
  securityNote: { textAlign: 'center', fontSize: 10 },
});