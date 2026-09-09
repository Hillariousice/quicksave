import { Colors } from '@/theme/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';

// --- UI COMPONENTS ---
interface GroupCardProps {
    title: string;
    type: string;
    progress: string;
    nextDate: string;
    groupId: string;
}

export const GroupCard: React.FC<GroupCardProps> = ({ title, type, progress, nextDate, groupId }) => {
    const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

    return(
     <TouchableOpacity style={[styles.groupCard, { backgroundColor: theme.inputBg }]} onPress={() => router.push(`/sub/groups/${groupId}`)}>
            <View style={styles.groupCardHeader}>
              <FontAwesome5 name="users" size={16} color={theme.textSecondary} />
              <Text style={styles.groupBadge}>{type}</Text>
            </View>
            <Text style={[styles.groupName, { color: theme.text }]}>{title}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>Progress</Text>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
            </View>
            <Text style={styles.nextDate}>🗓 Next: {nextDate}</Text>
          </TouchableOpacity>
)}

const styles = StyleSheet.create({
  groupCard: { width: 160, padding: 16, borderRadius: 16, marginRight: 16 },
  groupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  groupBadge: { backgroundColor: '#333', color: '#FFF', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  groupName: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, height: 40 },
  progressContainer: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { color: '#9BA1A6', fontSize: 10 },
  progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#FF8C00', borderRadius: 2 },
  nextDate: { color: '#9BA1A6', fontSize: 11 },
})
    