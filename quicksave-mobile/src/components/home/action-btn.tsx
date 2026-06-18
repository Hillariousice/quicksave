import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const ActionBtn = ({ icon, label, theme }: { icon: any, label: string, theme: any }) => (
  <TouchableOpacity style={styles.actionBtn}>
    <View style={[styles.actionIconBg, { backgroundColor: theme.inputBg }]}>
      <Feather name={icon} size={20} color={theme.text} />
    </View>
    <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

export default ActionBtn

const styles = StyleSheet.create({
 
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '500' },

})