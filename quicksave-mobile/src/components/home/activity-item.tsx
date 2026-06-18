import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const ActivityItem = ({ icon, title, date, amount, type, theme }: any) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIconBg, { backgroundColor: theme.inputBg }]}>
      <Feather name={icon} size={18} color={theme.text} />
    </View>
    <View style={styles.activityInfo}>
      <Text style={[styles.activityTitle, { color: theme.text }]}>{title}</Text>
      <Text style={styles.activityDate}>{date}</Text>
    </View>
    <Text style={[styles.activityAmount, { color: type === 'credit' ? '#34C759' : type === 'debit' ? '#FF3B30' : theme.textSecondary }]}>
      {amount || '--'}
    </Text>
  </View>
);

export default ActivityItem


const styles = StyleSheet.create({
  activityItem: { flexDirection: 'row', alignItems: 'center' },
  activityIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  activityDate: { fontSize: 12, color: '#9BA1A6' },
  activityAmount: { fontSize: 14, fontWeight: 'bold' },

})