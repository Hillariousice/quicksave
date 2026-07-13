import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming 
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';

const BUTTON_WIDTH = Dimensions.get('window').width - 48; // Screen width minus padding
const SWIPE_THRESHOLD = BUTTON_WIDTH * 0.75; // Must swipe 75% of the way to trigger

interface SwipeToPayProps {
  onConfirm: () => void;
  isLoading: boolean;
}

export default function SwipeToPay({ onConfirm, isLoading }: SwipeToPayProps) {
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  
  const translateX = useSharedValue(0);
  const [confirmed, setConfirmed] = useState(false);

  // Trigger the actual payment logic back in React-land
  const triggerConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (confirmed || isLoading) return; // Disable if already processing
      
      // Keep the thumb inside the track bounds
      if (event.translationX >= 0 && event.translationX <= BUTTON_WIDTH - 56) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (confirmed || isLoading) return;

      if (translateX.value > SWIPE_THRESHOLD) {
        // Swiped far enough! Snap to the end and trigger payment
        translateX.value = withSpring(BUTTON_WIDTH - 56, { damping: 15 });
        runOnJS(triggerConfirm)(); 
      } else {
        // Didn't swipe far enough. Snap back to the beginning!
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    width: translateX.value + 56, // The orange background fills in as you drag
  }));

  return (
    <View style={[styles.track, { backgroundColor: theme.inputBg }]}>
      {/* The background fill that grows as you swipe */}
      <Animated.View style={[styles.trackFill, { backgroundColor: theme.primary }, animatedTrackStyle]} />
      
      <Text style={[styles.trackText, { color: theme.textSecondary }]}>
        {isLoading ? 'Processing...' : confirmed ? 'Confirmed!' : 'Swipe to Contribute >>'}
      </Text>

      {/* The draggable Thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.thumb, { backgroundColor: theme.primary }, animatedThumbStyle]}>
          <Feather 
            name={isLoading ? "loader" : confirmed ? "check" : "chevron-right"} 
            size={24} 
            color="#111" 
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 56, borderRadius: 28, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  trackFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 28 },
  trackText: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', zIndex: 1 },
  thumb: { position: 'absolute', left: 0, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
});