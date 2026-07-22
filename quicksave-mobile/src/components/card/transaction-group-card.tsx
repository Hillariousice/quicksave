import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TransactionCard from './transaction-card'; 
import Animated, { FadeInUp } from 'react-native-reanimated'; 

interface TransactionGroupCardProps {
  group: { title: string; data: any[] };
  theme: any;
  formatCurrency: (val: number) => string;
  colorScheme: 'light' | 'dark';
}

function TransactionGroupCard({ group, theme, formatCurrency, colorScheme }: TransactionGroupCardProps) {
  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(400).springify()} style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{group.title}</Text>
      
      <View style={[styles.groupCard, { backgroundColor: theme.inputBg }]}>
        {group.data.map((tx: any, index: any) => {
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
    </Animated.View>
  );
}

export default memo(TransactionGroupCard);

const styles = StyleSheet.create({
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  groupCard: { borderRadius: 16, paddingHorizontal: 16, overflow: 'hidden' },
});