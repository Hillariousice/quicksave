import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { Colors } from '@/theme/Colors';

export default function FabricIndicator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // ⭐️ THE ULTIMATE FABRIC CHECK
  // If this object exists, the C++ JSI layer successfully injected the New Architecture!
  const isFabricEnabled = !!(global as any).nativeFabricUIManager;

  // We only want to show this in Development mode, never in Production!
  if (!__DEV__) return null;

  return (
    <SafeAreaView pointerEvents="none" style={styles.container}>
      <View style={[
        styles.badge, 
        { 
          backgroundColor: isFabricEnabled ? '#34C759' : '#FF3B30',
          borderColor: theme.background,
          borderWidth: 2
        }
      ]}>
        <Text style={styles.text}>
          {isFabricEnabled ? '🚀 Fabric Active' : '🐢 Legacy Bridge'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, 
    right: 20,
    zIndex: 9999,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});