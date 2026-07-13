import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import { Colors } from '@/theme/Colors';

export default function SkeletonLoader({ count = 5 }: { count?: number }) {
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const opacity = useRef(new Animated.Value(0.3)).current;

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  const skeletonItems = Array.from({ length: count }).map((_, index) => (
    <Animated.View 
      key={index} 
      style={[styles.skeletonRow, { backgroundColor: theme.inputBg, opacity }]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.inputBorder }]} />
      <View style={styles.textStack}>
        <View style={[styles.lineLong, { backgroundColor: theme.inputBorder }]} />
        <View style={[styles.lineShort, { backgroundColor: theme.inputBorder }]} />
      </View>
    </Animated.View>
  ));

  return <View style={styles.container}>{skeletonItems}</View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 16, paddingHorizontal: 24, paddingTop: 20 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 16 },
  textStack: { flex: 1, gap: 8 },
  lineLong: { height: 14, width: '60%', borderRadius: 4 },
  lineShort: { height: 10, width: '30%', borderRadius: 4 },
});