import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator, useColorScheme, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/theme/Colors';
import { api } from '@/api/client';
import { useAppDispatch } from '@/store';
import { fetchMyGroups } from '@/store/slices/groupSlice';
import { GroupService } from '@/api/services/group.service';


export default function CreateGroupScreen() {
  const router = useRouter();
  
  // 👉 Dynamic Light/Dark Mode!
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useAppDispatch();
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [slots, setSlots] = useState<number>(10);
  const [rotationMode, setRotationMode] = useState<'RANDOM' | 'JOIN_ORDER'>('RANDOM');
  
  // Date Picker State
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

 const handleCreateGroup = async () => {
  if (!name || !amount) {
    setErrorMsg('Please enter a group name and contribution amount.');
    return;
  }
  const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid contribution amount.');
      return;
    }
  setErrorMsg('');
  setLoading(true);
  try {
    await GroupService.createGroup({
      name,
      description: description || `Savings group for ${name}`,
      contributionAmount: Number(amount),
      frequency,
      maxCapacity: slots,
    });
    dispatch(fetchMyGroups()); // Refresh the list
    router.replace('/(tabs)/groups');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to create group';
    setErrorMsg(message);
  } finally {
    setLoading(false);
  }
};

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Group</Text>
        <View style={{ width: 24 }} /> {/* Spacer for centering */}
      </View>

      {/* PROGRESS BAR (Matching Figma) */}
      {/* <View style={styles.progressContainer}>
        <View style={[styles.progressDash, { backgroundColor: theme.primary }]} />
        <View style={[styles.progressDash, { backgroundColor: theme.inputBorder }]} />
        <View style={[styles.progressDash, { backgroundColor: theme.inputBorder }]} />
      </View> */}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* TITLES */}
        <Text style={[styles.title, { color: theme.text }]}>Group Details</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Set up the basic information for your new savings group.
        </Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* GROUP NAME */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>GROUP NAME</Text>
          <View style={[styles.textInputContainer, { backgroundColor: theme.inputBg }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Dream Vacation Fund"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>


{/* Place this inside your ScrollView before the Amount field */}
<View style={styles.inputGroup}>
  <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
  <View style={[styles.textInputContainer, { backgroundColor: theme.inputBg, height: 80 }]}>
    <TextInput
      style={[styles.input, { color: theme.text, textAlignVertical: 'top', paddingTop: 12 }]}
      placeholder="What is this group for? (min 5 characters)"
      placeholderTextColor={theme.textSecondary}
      multiline
      value={description}
      onChangeText={setDescription}
    />
  </View>
</View>
        {/* CONTRIBUTION AMOUNT */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>CONTRIBUTION AMOUNT</Text>
          <View style={[styles.textInputContainer, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>₦</Text>
            <TextInput
              style={[styles.input, { color: theme.text, marginLeft: 8 }]}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* FREQUENCY TOGGLES */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>FREQUENCY</Text>
          <View style={styles.pillContainer}>
            {['DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => {
              const isSelected = frequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.pill,
                    { 
                      backgroundColor: isSelected ? theme.primary : theme.inputBg,
                      borderColor: isSelected ? theme.primary : theme.inputBorder 
                    }
                  ]}
                  onPress={() => setFrequency(freq as any)}
                >
                  <Text style={[
                    styles.pillText, 
                    { color: isSelected ? '#111' : theme.textSecondary, fontWeight: isSelected ? 'bold' : '600' }
                  ]}>
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SLOTS SLIDER */}
        <View style={styles.inputGroup}>
          <View style={styles.slotsHeader}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>NUMBER OF SLOTS</Text>
            <Text style={[styles.slotsValue, { color: theme.primary }]}>{slots} slots</Text>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={2}
            maximumValue={20}
            step={1}
            value={slots}
            onValueChange={setSlots}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.inputBorder}
            thumbTintColor={theme.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>2</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>20</Text>
          </View>
        </View>

        {/* ROTATION MODE & START DATE (Extra settings for the engine) */}
        <View style={styles.rowGroup}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>ROTATION MODE</Text>
            <TouchableOpacity 
              style={[styles.modeToggle, { backgroundColor: theme.inputBg }]}
              onPress={() => setRotationMode(prev => prev === 'RANDOM' ? 'JOIN_ORDER' : 'RANDOM')}
            >
              <Feather name={rotationMode === 'RANDOM' ? 'shuffle' : 'list'} size={16} color={theme.text} />
              <Text style={[styles.modeText, { color: theme.text }]}>
                {rotationMode === 'RANDOM' ? 'Random' : 'Join Order'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>START DATE</Text>
            <TouchableOpacity 
              style={[styles.datePickerBtn, { backgroundColor: theme.inputBg }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Feather name="calendar" size={16} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Native Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            minimumDate={new Date()} // Can't start a group in the past!
            onChange={onDateChange}
          />
        )}

      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.submitButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16 },
  progressDash: { width: 40, height: 4, borderRadius: 2 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 32 },
  
  errorBox: { backgroundColor: '#FF3B3020', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontSize: 14, fontWeight: '500' },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  
  textInputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  currencySymbol: { fontSize: 18, fontWeight: 'bold' },

  pillContainer: { flexDirection: 'row', gap: 12 },
  pill: { flex: 1, height: 45, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pillText: { fontSize: 14 },

  slotsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  slotsValue: { fontSize: 12, fontWeight: 'bold' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: -4 },

  rowGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  modeToggle: { flexDirection: 'row', height: 48, borderRadius: 12, alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  modeText: { fontSize: 14, fontWeight: '600' },
  datePickerBtn: { flexDirection: 'row', height: 48, borderRadius: 12, alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  dateText: { fontSize: 14, fontWeight: '600' },

  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  submitButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});