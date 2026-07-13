import { Stack } from "expo-router";
import React from 'react';

export default function GroupLayout() {
    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="[id]" options={{ headerShown: false }} />
            <Stack.Screen name="create-group" options={{ headerShown: false }} />
            <Stack.Screen name="scan" options={{ headerShown: false }} />
        </Stack>
    );
}