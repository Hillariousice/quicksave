import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, withRepeat, withTiming, useSharedValue, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/theme/Colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  const [isReadyToRoute, setIsReadyToRoute] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<string | null>(null);

  // Animation values for the glowing pulse effect
  const scale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    // 1. Start the premium pulsing animation
    scale.value = withSequence(
      withTiming(1.05, { duration: 1000 }),
      withTiming(1, { duration: 500 })
    );
    glowOpacity.value = withRepeat(withTiming(0.6, { duration: 1000 }), -1, true);

    // 2. Check storage in the background while the animation plays
    const checkState = async () => {
      const seen = await SecureStore.getItemAsync('hasSeenOnboarding');
      setHasSeenOnboarding(seen);
      
      // Hold the splash screen for exactly 2.5 seconds for branding impact
      setTimeout(() => {
        setIsReadyToRoute(true);
      }, 2500);
    };

    checkState();
  }, []);

  // 3. Handle the routing once the timer finishes
  useEffect(() => {
    if (isReadyToRoute) {
      if (hasSeenOnboarding === 'true') {
        // They already know what QuickSave is, send them to login!
        router.replace('/auth/login');
      } else {
        // Send them to the swiping onboarding screen you built!
        router.replace('/onboarding');
      }
    }
  }, [isReadyToRoute, hasSeenOnboarding, router]);

  // The Animated Styles
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn.duration(1000)} exiting={FadeOut.duration(500)} style={styles.content}>
        
        {/* The Glowing Shield */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.glow, { backgroundColor: theme.primary }, animatedGlowStyle]} />
          <Animated.View style={animatedLogoStyle}>
            <FontAwesome5 name="shield-alt" size={80} color={theme.primary} />
          </Animated.View>
        </View>

        {/* The Brand Name */}
        <Animated.Text entering={FadeIn.delay(500).duration(800)} style={[styles.title, { color: theme.text }]}>
          QUICKSAVE
        </Animated.Text>
        
        <Animated.Text entering={FadeIn.delay(1000).duration(800)} style={[styles.tagline, { color: theme.textSecondary }]}>
          Secure. Transparent. Together.
        </Animated.Text>

      </Animated.View>

      {/* Footer Powered By text */}
      <Animated.Text entering={FadeIn.delay(1500).duration(800)} style={[styles.footer, { color: theme.textSecondary }]}>
        Powered by Ajo Engine
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    width: 150,
    height: 150,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    filter: 'blur(20px)', // Adds a modern web-like glow if supported, otherwise opacity handles it
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});