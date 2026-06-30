import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, useColorScheme, Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store';
import { submitContribution } from '@/store/slices/contributionSlice';
import { enqueueContribution } from '@/store/slices/offlineQueueSlice';

export default function MakeContributionScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams();
  
  // 👉 Dynamic Light/Dark Mode
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dispatch = useAppDispatch();
  const { balance: walletBalance } = useAppSelector(state => state.wallet);
  const { currentGroup: groupData } = useAppSelector(state => state.groups);
  const { isProcessingPayment } = useAppSelector(state => state.contributions);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  

  // Fetch real wallet and group data
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [walletRes, groupRes] = await Promise.all([
  //         api.get('/wallets'),
  //         api.get(`/groups/${groupId}`)
  //       ]);
        
  //       if (walletRes.data?.data) setWalletBalance(walletRes.data.data.balance);
  //       if (groupRes.data?.data) {
  //         setGroupData({
  //           name: groupRes.data.data.name,
  //           amount: groupRes.data.data.contributionAmount,
  //           nextCollection: 'This Cycle' // You can calculate exact date using your Rotation engine
  //         });
  //       }
  //     } catch (error) {
  //       console.log("Using fallback mock data for preview.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, [groupId]);

  const { isConnected, isInternetReachable } = useAppSelector(state => state.network);
const isOffline = isConnected === false || isInternetReachable === false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
      .format(amount);
  };

  const handleConfirmContribution = async () => {
    if (walletBalance < groupData.amount) {
      Alert.alert("Insufficient Funds", "Please fund your QuickSave wallet to complete this contribution.");
      return;
    }

    Alert.alert(
      "Confirm Payment", 
      `Are you sure you want to contribute ₦${groupData.amount} to ${groupData.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setSubmitting(true);
            try {
             
                 if (isOffline) {
              await dispatch(enqueueContribution({ 
                groupId: groupId as string, 
                amount: groupData.amount 
              })).unwrap();

              Alert.alert(
                "Saved Offline 📡", 
                "You are currently offline. Your contribution has been securely saved and will automatically process when your connection returns."
              );
              router.replace('/(tabs)/savings'); // Send back to wallet
              return; // Stop execution here!
            }
              const receipt = await dispatch(submitContribution(groupId as string)).unwrap();
              
              const successData = { metadata: { amount: groupData.contributionAmount } };
              
              router.replace({ 
                pathname: '/sub/notifications/contribution', 
                params: { data: JSON.stringify(receipt.data.data) } 
              });

            } catch (error: any) {
              Alert.alert("Error", error.response?.data?.message || "Payment failed.");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Make Contribution</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Feather name="help-circle" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* GROUP INFO CARD */}
        <View style={[styles.card, { backgroundColor: theme.inputBg }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: theme.primary }]}>CONTRIBUTING TO</Text>
              <Text style={[styles.groupName, { color: theme.text }]}>{groupData.name}</Text>
              <Text style={[styles.collectionDate, { color: theme.textSecondary }]}>
                Next collection: {groupData.nextCollection}
              </Text>
            </View>
            <View style={[styles.groupIconBg, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}>
              <FontAwesome5 name="users" size={16} color={theme.primary} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Required Amount</Text>
            <Text style={[styles.amountValue, { color: theme.primary }]}>{formatCurrency(groupData.amount)}</Text>
          </View>
        </View>

        {/* PAYMENT SOURCE */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PAYMENT SOURCE</Text>
          <TouchableOpacity>
            <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.paymentCard, { backgroundColor: theme.inputBg }]}>
          <View style={[styles.walletIconBg, { backgroundColor: theme.primary + '20' }]}>
            <FontAwesome5 name="wallet" size={16} color={theme.primary} />
          </View>
          
          <View style={styles.walletDetails}>
            <View style={styles.walletTitleRow}>
              <Text style={[styles.walletTitle, { color: theme.text }]}>QS Wallet</Text>
              <View style={[styles.activeBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.activeText, { color: theme.primary }]}>Active</Text>
              </View>
            </View>
            <Text style={[styles.walletBalance, { color: theme.textSecondary }]}>
              Available Balance: {formatCurrency(walletBalance)}
            </Text>
          </View>

          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        {/* TRANSACTION SUMMARY */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 12 }]}>TRANSACTION SUMMARY</Text>
        <View style={[styles.summaryCard, { backgroundColor: theme.inputBg }]}>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Contribution Amount</Text>
            <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>{formatCurrency(groupData.amount)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Processing Fee</Text>
            <View style={styles.feeContainer}>
              <Text style={[styles.strikethrough, { color: theme.textSecondary }]}>₦50.00</Text>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          </View>

          <View style={[styles.divider, { marginVertical: 16 }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total to Pay</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>{formatCurrency(groupData.amount)}</Text>
          </View>
        </View>

        {/* SECURITY NOTE */}
        <View style={[styles.securityNote, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F9FAFB' }]}>
          <FontAwesome5 name="shield-alt" size={14} color={theme.textSecondary} style={styles.securityIcon} />
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            Your contribution is secured and will be added to the total pot immediately.
          </Text>
        </View>

      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={[styles.confirmButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleConfirmContribution}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#111" />
          ) : (
            <View style={styles.btnContent}>
              <Feather name={isOffline ? "cloud-off" : "lock"}  size={16} color="#111" />
              <Text style={styles.confirmButtonText}>{isOffline ? "Save Offline Contribution" : "Confirm Contribution"}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  helpButton: { padding: 5, borderWidth: 1, borderColor: '#333', borderRadius: 12 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },

  // Group Info Card
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  groupName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  collectionDate: { fontSize: 12 },
  groupIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 14, fontWeight: '500' },
  amountValue: { fontSize: 18, fontWeight: 'bold' },

  // Payment Source
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  changeText: { fontSize: 12, fontWeight: '600' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 32 },
  walletIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  walletDetails: { flex: 1 },
  walletTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  walletTitle: { fontSize: 16, fontWeight: '600', marginRight: 8 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  activeText: { fontSize: 10, fontWeight: 'bold' },
  walletBalance: { fontSize: 12 },

  // Transaction Summary
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  feeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strikethrough: { textDecorationLine: 'line-through', fontSize: 14 },
  freeText: { color: '#34C759', fontSize: 12, fontWeight: 'bold', backgroundColor: '#34C75915', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },

  // Security Note
  securityNote: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  securityIcon: { marginRight: 12 },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  confirmButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});