import { Stack } from "expo-router";
import React from 'react';

export default function ProfileLayout() {
    return (
        <Stack
        screenOptions={{
            headerShown: false
        }}>
            <Stack.Screen name="edit" options={{ headerShown: false }} />
            <Stack.Screen name="help-support" options={{ headerShown: false }} />
            <Stack.Screen name="bank" options={{ headerShown: false }} />
            <Stack.Screen name="change-password" options={{ headerShown: false }} />
            <Stack.Screen name="security" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
            <Stack.Screen name="verify-twofa" options={{ headerShown: false }} />
        </Stack>
    );
}