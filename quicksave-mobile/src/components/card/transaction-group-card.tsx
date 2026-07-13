import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TransactionCard from './transaction-card'; 

interface TransactionGroupCardProps {
  group: { title: string; data: any[] };
  theme: any;
  formatCurrency: (val: number) => string;
  colorScheme: 'light' | 'dark';
}

function TransactionGroupCard({ group, theme, formatCurrency, colorScheme }: TransactionGroupCardProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{group.title}</Text>
      
      <View style={[styles.groupCard, { backgroundColor: theme.inputBg }]}>
        {group.data.map((tx, index) => {
          const isLast = index === group.data.length - 1;
          
          return (
            <TransactionCard 
              key={tx.id}
              tx={tx}
              theme={theme}
              isLast={isLast}
              formatCurrency={formatCurrency}
              colorScheme={colorScheme}
              isEarlier={group.title === 'EARLIER'} // Pass this to format the date string
            />
          );
        })}
      </View>
    </View>
  );
}

export default memo(TransactionGroupCard);

const styles = StyleSheet.create({
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  groupCard: { borderRadius: 16, paddingHorizontal: 16, overflow: 'hidden' },
});