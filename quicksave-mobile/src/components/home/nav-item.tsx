import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";

const NavItem = ({ icon, label, isActive, theme }: any) => (
  <TouchableOpacity style={styles.navItem}>
    <Feather name={icon} size={24} color={isActive ? theme.primary : theme.textSecondary} />
    <Text style={[styles.navLabel, { color: isActive ? theme.primary : theme.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

export default NavItem

const styles = StyleSheet.create({
   navItem: { alignItems: 'center', gap: 4 },
   navLabel: { fontSize: 10, fontWeight: '500' }

})