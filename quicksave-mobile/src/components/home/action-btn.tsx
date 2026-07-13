import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function ActionBtn({ icon, label, theme, onPress }: any) {
  // Shared value for the scale animation
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable 
      onPress={onPress}
      // Shrink slightly when pressed down
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 10 }); }}
      // Bounce back up when released
      onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
    >
      <Animated.View style={[styles.actionBtn, animatedStyle]}>
        <View style={[styles.actionIconBg, { backgroundColor: theme.inputBg }]}>
          <Feather name={icon} size={20} color={theme.text} />
        </View>
        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '500' },
});