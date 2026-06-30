import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: theme.inputBg }]}>
        <Feather name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 },
  iconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  buttonText: { color: '#111', fontWeight: 'bold', fontSize: 14 }
});