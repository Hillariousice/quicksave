import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconBg, { backgroundColor: '#FF3B3015' }]}>
        <Feather name="alert-triangle" size={32} color="#FF3B30" />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Oops! Something went wrong.</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{message}</Text>
      
      <TouchableOpacity style={[styles.button, { borderColor: theme.inputBorder }]} onPress={onRetry}>
        <Feather name="refresh-cw" size={14} color={theme.text} style={{ marginRight: 8 }} />
        <Text style={[styles.buttonText, { color: theme.text }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  iconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  button: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
  buttonText: { fontWeight: '600', fontSize: 14 }
});