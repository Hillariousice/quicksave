import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

export default function PendingSyncBadge() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[styles.badge, { backgroundColor: '#FF8C0020' }]}>
      <Feather name="cloud-off" size={12} color={theme.primary} />
      <Text style={[styles.text, { color: theme.primary }]}>Pending Sync</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});