import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface TransactionCardProps {
  tx: any;
  theme: any;
  isLast: boolean;
  formatCurrency: (val: number) => string;
}

function TransactionCard({ tx, theme, isLast, formatCurrency }: TransactionCardProps) {
  const isCredit = tx.type === 'FUNDING' || tx.type === 'PAYOUT';
  const amountColor = isCredit ? '#34C759' : '#FF3B30';
  const sign = isCredit ? '+' : '-';
  
  // Icon logic
  const getIconConfig = () => {
    if (tx.type === 'FUNDING') return { icon: 'arrow-up', bg: '#8B5A2B20', color: '#D2B48C' };
    if (tx.type === 'WITHDRAWAL') return { icon: 'university', bg: '#FF3B3015', color: '#FF8C00' };
    if (tx.type === 'CONTRIBUTION') return { icon: 'users', bg: '#FF8C0020', color: '#FF8C00' };
    if (tx.type === 'PAYOUT') return { icon: 'money-bill-wave', bg: '#34C75915', color: '#34C759' };
    return { icon: 'credit-card', bg: '#FF3B3015', color: '#FF6B6B' };
  };
  const { icon, bg, color } = getIconConfig();

  const txTime = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.txRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.inputBorder }]}>
      <View style={[styles.txIconBg, { backgroundColor: bg }]}>
        <FontAwesome5 name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.txDetails}>
        <Text style={[styles.txDescription, { color: theme.text }]} numberOfLines={1}>
          {tx.description || tx.type}
        </Text>
        <Text style={styles.txTime}>{txTime}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>
        {sign}₦{formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}

// ⭐️ THE SECRET SAUCE: React.memo() intercepts re-renders!
export default memo(TransactionCard);

const styles = StyleSheet.create({
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  txIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  txDetails: { flex: 1, justifyContent: 'center' },
  txDescription: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  txTime: { fontSize: 12, color: '#9BA1A6' },
  txAmount: { fontSize: 15, fontWeight: '500' },
});