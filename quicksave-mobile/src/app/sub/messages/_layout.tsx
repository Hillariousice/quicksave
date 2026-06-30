import { Stack } from "expo-router";
import React from 'react';

export default function MessageLayout() {
    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="group" options={{ headerShown: false }} />
            <Stack.Screen name="support" options={{ headerShown: false }} />
        </Stack>
    );
}