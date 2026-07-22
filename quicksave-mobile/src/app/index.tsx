import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

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
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const completeOnboarding = async () => {
    // Save the flag to SecureStore
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    // Send them to Login (or Register)
    router.replace('/auth/login');
  };

  const Paginator = () => {
    return (
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotStyle = useAnimatedStyle(() => {
            const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolate.CLAMP);
            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.3, 1, 0.3],
              Extrapolate.CLAMP,
            );
            return { width: dotWidth, opacity };
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { backgroundColor: theme.primary }, dotStyle]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* SKIP BUTTON */}
      <SafeAreaView style={styles.header}>
        <View style={styles.branding}>
          <FontAwesome5 name="shield-alt" size={18} color={theme.primary} />
          <Text style={[styles.brandText, { color: theme.text }]}>QUICKSAVE</Text>
        </View>
        <TouchableOpacity onPress={() => completeOnboarding()}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Log In</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* SWIPEABLE LIST */}
      <Animated.FlatList
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler} // 👉 Attached to Reanimated
        scrollEventThrottle={16} // Fires every 16ms for buttery 60fps tracking
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={styles.iconContainer}
            >
              <View style={[styles.iconGlow, { backgroundColor: theme.primary + '15' }]}>
                <FontAwesome5 name={item.icon as any} size={60} color={theme.primary} />
              </View>
            </Animated.View>

            <View style={styles.textContainer}>
              <Animated.Text
                entering={FadeInDown.delay(200).duration(600)}
                style={[styles.title, { color: theme.text }]}
              >
                {item.title}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300).duration(600)}
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                {item.subtitle}
              </Animated.Text>
            </View>
          </View>
        )}
      />

      {/* BOTTOM SECTION */}
      <SafeAreaView style={styles.footer}>
        <Paginator />

        {/* PREMIUM GRADIENT BUTTON */}
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => router.push('/auth/register')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF8C00', '#E67E00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#111" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  branding: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skipText: { fontSize: 16, fontWeight: '600' },

  slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { flex: 0.6, justifyContent: 'center', alignItems: 'center' },
  iconGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  textContainer: { flex: 0.4, paddingHorizontal: 32, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },

  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: { height: 8, borderRadius: 4 },

  buttonWrapper: {
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#111', fontSize: 18, fontWeight: 'bold' },
});
