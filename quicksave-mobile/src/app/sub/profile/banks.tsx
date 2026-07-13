import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, 
  useColorScheme, ScrollView, Modal, FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { UserService } from '@/api/services/user.service';

export default function BankAccountScreen() {
  const router = useRouter();
  const theme = useColorScheme() === 'dark' ? Colors.dark : Colors.light;

  // Form States
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setFetchingData(true);
        
        // 1. Fetch all available banks from Paystack via Backend
        const allBanks = await UserService.getAvailableBanks();
        setAvailableBanks(allBanks);

        // 2. Fetch the user's already saved bank details
        const savedBanks = await UserService.getBanks();
        
        if (savedBanks && savedBanks.length > 0) {
          const primaryAccount = savedBanks.find((b: any) => b.isDefault) || savedBanks[0];
          
          // Pre-fill the account number and name
          setAccountNumber(primaryAccount.accountNumber);
          setResolvedName(primaryAccount.accountName);

          // Find and set the bank object in the list to pre-fill the dropdown
          const matchedBank = allBanks.find((b: any) => b.code === primaryAccount.bankCode);
          if (matchedBank) {
            setSelectedBank(matchedBank);
          }
        }
      } catch (e) {
        console.error("Failed to load bank data", e);
      } finally {
        setFetchingData(false);
      }
    };

    initializeData();
  }, []);

  // Effect to trigger verification when number reaches 10 digits
  // (But only if the user actually changes the number, not just on initial load)
  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(text);
    if (text.length === 10 && selectedBank) {
      verifyAndSave(text, selectedBank);
    } else {
      setResolvedName(null);
    }
  };

  const verifyAndSave = async (num: string, bank: any) => {
    setLoading(true);
    try {
      const res = await UserService.addBank({
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: num
      });
      setResolvedName(res.accountName);
    } catch (e: any) {
      setResolvedName(null);
      alert(e.response?.data?.message || "Could not resolve account");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Fetching details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Bank Selection Modal */}
      <Modal visible={showBankModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.inputBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.title, { color: theme.text, fontSize: 18 }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableBanks}
              keyExtractor={(item, index) => `${item.code}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.bankItem}
                  onPress={() => {
                    setSelectedBank(item);
                    setShowBankModal(false);
                    if (accountNumber.length === 10) verifyAndSave(accountNumber, item);
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Bank Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Your Payout Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>This is where your Ajo payouts will be sent.</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>BANK NAME</Text>
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: theme.inputBg }]} 
              onPress={() => setShowBankModal(true)}
            >
              <Text style={[styles.inputText, { color: selectedBank ? theme.text : theme.textSecondary }]}>
                {selectedBank ? selectedBank.name : 'Choose a bank'}
              </Text>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>ACCOUNT NUMBER</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.inputText, { color: theme.text, flex: 1 }]}
                placeholder="0123456789"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={10}
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
              />
              {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>
          </View>

          {resolvedName && (
            <View style={styles.resolvedContainer}>
              <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
              <Text style={[styles.resolvedText, { color: theme.primary }]}>{resolvedName}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: resolvedName ? 1 : 0.5 }]}
            disabled={!resolvedName || loading}
            onPress={() => {
              alert('Settings Updated!');
              router.back();
            }}
          >
            <Text style={styles.primaryButtonText}>Update Bank Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  inputText: { flex: 1, fontSize: 16, fontWeight: '500' },
  resolvedContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resolvedText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryButton: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bankItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' }
});