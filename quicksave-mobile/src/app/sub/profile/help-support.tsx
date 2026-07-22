import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { UserService } from '@/api/services/user.service';

const FAQS = [
  {
    id: '1',
    question: 'How do I join a group?',
    answer: 'Enter an invite code provided by the group admin on the Join Group screen.',
  },
  {
    id: '2',
    question: 'Is my money safe?',
    answer:
      'Yes. All funds are secured in the Quicksave Vault technology until the cycle completes.',
  },
  {
    id: '3',
    question: 'How do payouts work?',
    answer: 'Payouts automatically process to your wallet based on the group rotation schedule.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const handleEmail = async () => {
    const email = 'quicksave.app@gmail.com';
    const url = `mailto:${email}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Unable to open mail client');
    }
  };
  const CategoryCard = ({ icon, title, onPress }: any) => (
    <TouchableOpacity
      style={[styles.catCard, { backgroundColor: theme.inputBg }]}
      onPress={onPress}
    >
      <View style={[styles.catIconBg, { backgroundColor: theme.primary + '15' }]}>
        <Feather name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={[styles.catTitle, { color: theme.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.primary, marginLeft: 16 }]}>
            Help & Support
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.inputBg }]}>
          <Feather name="download" size={16} color={theme.textSecondary} />
        </TouchableOpacity> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SEARCH */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
          <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search for help topics..."
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* CATEGORIES */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
        <View style={styles.grid}>
          <CategoryCard
            icon="rocket"
            title="Getting Started"
            onPress={() => router.push('/auth/register')}
          />
          <CategoryCard
            icon="shield"
            title="Account & Security"
            onPress={() => router.push('/sub/profile/security')}
          />
          <CategoryCard
            icon="users"
            title="Savings Groups"
            onPress={() => router.push('/(tabs)/groups')}
          />
          <CategoryCard
            icon="credit-card"
            title="Payouts & Withdrawals"
            onPress={() => router.push('/sub/wallet/withdraw')}
          />
        </View>

        {/* FAQS */}
        <View style={styles.faqHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>FAQ</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAll, { color: theme.primary }]}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12 }}>
          {FAQS.map((faq: any) => (
            <TouchableOpacity
              key={faq.id}
              style={[styles.faqCard, { backgroundColor: theme.inputBg }]}
              onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            >
              <View style={styles.faqRow}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                <Feather
                  name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
              {expandedId === faq.id && (
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTACT BOTTOM */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>
          Still need help?
        </Text>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/sub/messages/support')}
        >
          <Feather name="message-square" size={18} color="#111" />
          <Text style={[styles.contactButtonText, { color: '#111' }]}>Chat with us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.contactButton,
            { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder },
          ]}
          onPress={handleEmail}
        >
          <Feather name="mail" size={18} color={theme.text} />
          <Text style={[styles.contactButtonText, { color: theme.text }]}>Send an email</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },

  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  catCard: { width: '48%', padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  catIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  catTitle: { fontSize: 13, fontWeight: '500' },

  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  faqCard: { padding: 16, borderRadius: 12 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '500' },
  faqAnswer: { fontSize: 13, marginTop: 12, lineHeight: 20 },

  contactButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactButtonText: { fontSize: 16, fontWeight: 'bold' },
});
