import { Stack } from "expo-router";
import React from 'react';

export default function WalletLayout() {
    return (
        <Stack>
            <Stack.Screen name="fund" options={{ headerShown: false }} />
            <Stack.Screen name="withdraw" options={{ headerShown: false }} />
            <Stack.Screen name="confirm-withdraw" options={{ headerShown: false }} />
            <Stack.Screen name="transaction-receipt" options={{ headerShown: false }} />
            <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
        </Stack>
    );
}