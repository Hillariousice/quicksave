import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/theme/Colors';

// This is a mathematically generated blurred version of a generic gray avatar.
// It loads instantly (0 network requests) while the real image downloads!
const blurhash = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

interface CachedAvatarProps {
  uri: string | null | undefined;
  size?: number;
  style?: any;
}

export default function CachedAvatar({ uri, size = 40, style }: CachedAvatarProps) {
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  // Fallback to a default avatar if the user hasn't uploaded one
  const source = uri ? { uri } : { uri: 'https://i.pravatar.cc/150?img=11' };

  return (
    <Image
      style={[
        styles.avatar, 
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.inputBg },
        style
      ]}
      source={source}
      placeholder={blurhash} // 👉 Renders instantly before the image arrives
      contentFit="cover"
      transition={300} // 👉 Smooth 300ms fade-in when the image finishes loading
      cachePolicy="memory-disk" // ⭐️ Caches to RAM and Phone Storage!
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
});