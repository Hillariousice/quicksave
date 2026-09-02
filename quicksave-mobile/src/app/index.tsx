import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar, // Added
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

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '1', title: 'Pool money with people you trust', subtitle: 'Create groups, set goals, and save together securely.', icon: 'users' },
  { id: '2', title: 'Automated Payout Rotations', subtitle: 'No more arguments. QuickSave automatically pays out the right person on time.', icon: 'sync-alt' },
  { id: '3', title: 'Secure Wallet & Withdrawals', subtitle: 'Fund your wallet and withdraw straight to your bank account anytime.', icon: 'wallet' },
  { id: '4', title: 'Grow your savings with interest', subtitle: 'Earn interest on your savings and watch your money grow.', icon: 'piggy-bank' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollX.value = event.contentOffset.x; },
  });

  // Updated to handle both Login and Register paths
  const handleNavigation = async (path: '/auth/login' | '/auth/register') => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    router.replace(path);
  };

  const Paginator = () => {
    return (
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotStyle = useAnimatedStyle(() => {
            const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolate.CLAMP);
            const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolate.CLAMP);
            return { width: dotWidth, opacity };
          });
          return <Animated.View key={i} style={[styles.dot, { backgroundColor: theme.primary }, dotStyle]} />;
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* FIXED HEADER: Added padding for Android Status Bar */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }]}>
        <View style={styles.branding}>
          <FontAwesome5 name="shield-alt" size={18} color={theme.primary} />
          <Text style={[styles.brandText, { color: theme.text }]}>QUICKSAVE</Text>
        </View>
        <TouchableOpacity onPress={() => handleNavigation('/auth/login')}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Log In</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconGlow, { backgroundColor: theme.primary + '15' }]}>
                <FontAwesome5 name={item.icon as any} size={60} color={theme.primary} />
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* FIXED FOOTER: Increased bottom padding for Gesture Bars */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 40 : 30 }]}>
        <Paginator />
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => handleNavigation('/auth/register')} // Now marks onboarding as done
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF8C00', '#E67E00']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#111" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    zIndex: 10,
  },
  branding: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skipText: { fontSize: 16, fontWeight: '600' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { flex: 0.5, justifyContent: 'center', alignItems: 'center' },
  iconGlow: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 0.4, paddingHorizontal: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  buttonWrapper: { elevation: 5 },
  button: { flexDirection: 'row', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { color: '#111', fontSize: 18, fontWeight: 'bold' },
});