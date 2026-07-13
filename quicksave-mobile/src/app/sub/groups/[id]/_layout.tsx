import { Stack } from "expo-router";
import React from 'react';

export default function GroupIdLayout() {
    return (
        <Stack
        screenOptions={{headerShown: false}}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="invite-member" options={{ headerShown: false }} />
            <Stack.Screen name="contribute-member" options={{ headerShown: false }} />
            <Stack.Screen name="join-group" options={{ headerShown: false }} />
            <Stack.Screen name="rotate-member" options={{ headerShown: false }} />
        </Stack>
    );
}