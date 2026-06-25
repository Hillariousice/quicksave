import { Stack } from "expo-router";
import React from 'react';

export default function NotificationLayout() {
    return (
        <Stack>
            <Stack.Screen name="contribution" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="new-member" options={{ headerShown: false }} />
            <Stack.Screen name="payout" options={{ headerShown: false }} />
        </Stack>
    );
}