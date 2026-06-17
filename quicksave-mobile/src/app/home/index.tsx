import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import React from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  // Grab the user data we saved to Redux during login!
  const user = useSelector((state: any) => state.auth.user); 

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    dispatch(logout());
    router.replace('/auth/login');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dashboard</Text>
      <Text style={{ marginVertical: 20 }}>Welcome, {user?.firstName}!</Text>
      <Button title="Log Out" color="red" onPress={handleLogout} />
    </View>
  );
}