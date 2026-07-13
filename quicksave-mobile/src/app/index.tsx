import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  useColorScheme, SafeAreaView, FlatList, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

// 1. Define your dynamic onboarding slides
const SLIDES = [
  {
    id: '1',
    title: 'Pool money with people you trust',
    subtitle: 'Create groups, set goals, and save together securely.',
    icon: 'users',
  },
  {
    id: '2',
    title: 'Automated Payout Rotations',
    subtitle: 'No more arguments. QuickSave automatically pays out the right person on time.',
    icon: 'sync-alt',
  },
  {
    id: '3',
    title: 'Secure Wallet & Withdrawals',
    subtitle: 'Fund your wallet and withdraw straight to your bank account anytime.',
    icon: 'wallet',
  },
  {
    id: '4',
    title: 'Grow your savings with interest',
    subtitle: 'Earn interest on your savings and watch your money grow.',
    icon: 'piggy-bank',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Updates the current index when the user physically swipes
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const completeOnboarding = async () => {
    // Save the flag to SecureStore
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    // Send them to Login (or Register)
    router.replace('/auth/login');
  };

  // Navigates to the next slide, or to Register if it's the last slide
 const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding(); // Modified this
    }
  };

  // Allows the user to tap a specific dot to jump to that slide
  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="shield-alt" size={20} color={theme.primary} />
          <Text style={[styles.logoText, { color: theme.text }]}>QUICKSAVE</Text>
        </View>
        <TouchableOpacity onPress={() => completeOnboarding()}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Slides Area */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              {/* Illustration */}
              <View style={styles.illustrationContainer}>
                <View style={styles.mockImage}>
                  <FontAwesome5 name={item.icon} size={60} color={theme.primary} />
                </View>
              </View>

              {/* Text */}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Footer (Dots and Button) */}
      <View style={styles.footerContainer}>
        
        {/* Interactive Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => goToSlide(index)}
              style={styles.dotHitbox}
            >
              <View 
                style={[
                  styles.dot, 
                  currentIndex === index 
                    ? [styles.activeDot, { backgroundColor: theme.primary }] 
                    : { backgroundColor: theme.inputBorder }
                ]} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  skipText: { fontSize: 16, fontWeight: '500' },
  
  slide: { flex: 1, justifyContent: 'center' },
  illustrationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mockImage: { 
    width: 250, height: 250, backgroundColor: '#1C2B36', 
    borderRadius: 20, justifyContent: 'center', alignItems: 'center' 
  },
  textContainer: { paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
  footerContainer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 30 },
  dotHitbox: { padding: 4 }, // Makes the dots easier to tap with your finger
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 24 },
  
  button: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  buttonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});