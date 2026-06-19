import React from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function PayoutAlertDetailScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const notification = data ? JSON.parse(data as string) : {};
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Format currency
  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(notification.metadata?.amount || 120000).replace('.00', '');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Payout Alert</Text>
        </TouchableOpacity>
        <Feather name="bell" size={20} color={theme.textSecondary} />
      </View>

      <View style={styles.content}>
        {/* BIG ICON */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlow, { backgroundColor: `${theme.primary}15` }]}>
            <MaterialCommunityIcons name="gift-outline" size={40} color={theme.primary} />
          </View>
        </View>

        {/* TEXT */}
        <Text style={[styles.congratsText, { color: theme.text }]}>Congratulations, Hillary!</Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          You have been selected as this month's recipient.
        </Text>

        <Text style={[styles.amountLabel, { color: theme.primary }]}>PAYOUT AMOUNT</Text>
        <Text style={[styles.amountText, { color: theme.text }]}>{amount}</Text>

        {/* INFO CARD */}
        <View style={[styles.infoCard, { backgroundColor: theme.inputBg }]}>
          <View style={styles.infoRow}>
            <View style={styles.groupIconBg}>
              <FontAwesome5 name="users" size={14} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Group</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {notification.metadata?.groupName || 'Lagos Entrepreneurs'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>Oct 24, 2026</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Ready for Payout</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECURITY NOTE */}
        <View style={styles.securityNote}>
          <View style={styles.shieldIcon}>
            <FontAwesome5 name="shield-alt" size={14} color={theme.primary} />
          </View>
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            Funds are secured by QuickSave Escrow and ready for immediate transfer to your linked bank account.
          </Text>
        </View>
      </View>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons name="bank-transfer" size={24} color="#111" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Withdraw to Bank</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>View Group Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  iconWrapper: { marginBottom: 24 },
  iconGlow: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  
  congratsText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subText: { fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  
  amountLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  amountText: { fontSize: 48, fontWeight: 'bold', marginBottom: 40 },
  
  infoCard: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupIconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#9BA1A6', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF8C0015', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF8C00' },
  statusText: { color: '#FF8C00', fontSize: 12, fontWeight: 'bold' },
  
  securityNote: { flexDirection: 'row', paddingHorizontal: 10, gap: 12, alignItems: 'center' },
  shieldIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF8C0020', justifyContent: 'center', alignItems: 'center' },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },

  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { height: 56, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
});