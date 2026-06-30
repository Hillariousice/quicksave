import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppSelector } from '../../store';

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useAppSelector((state) => state.network);
  
  // Animation value starts off-screen (-100)
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // We are offline if there is no connection, OR if connected but internet is unreachable
  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -150, // Hide it far off screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <SafeAreaView>
        <View style={styles.banner}>
          <Feather name="wifi-off" size={14} color="#FFF" />
          <Text style={styles.text}>No internet connection. Operating offline.</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensures it sits above EVERY screen and header
    backgroundColor: '#FF3B30', // QuickSave Danger Red
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10, // Adjusts for Android status bar
  },
  text: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 8,
  },
});