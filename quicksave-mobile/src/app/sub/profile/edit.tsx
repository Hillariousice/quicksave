import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Image, useColorScheme, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { UserService } from '@/api/services/user.service';
import { restoreSession } from '@/store/slices/authSlice';
import * as ImagePicker from 'expo-image-picker'; 

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const user = useSelector((state: any) => state.auth.user);
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(user?.avatar || 'https://i.pravatar.cc/150?img=11');
  
  const [formData, setFormData] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`,
    email: user?.email || '',
    phone: user?.phone || '',
    bio: 'Digital product designer focused on high-performance fintech solutions. Saving for a brighter future with Quicksave.'
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // We use base64 to send the image as a string in JSON
    });

    if (!result.canceled) {
      // result.assets[0].base64 contains the raw string
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const names = formData.fullName.split(' ');
      await UserService.updateProfile({
        firstName: names[0],
        lastName: names[1] || '',
        phone: formData.phone,
        email: formData.email,
        avatar: selectedImage || user?.avatar 
      });
      await dispatch(restoreSession()); // Update Redux with new info
      router.back();
    } catch (e) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* AVATAR EDIT */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: selectedImage || user?.avatar || 'https://i.pravatar.cc/150?img=11' }} style={[styles.avatar, { borderColor: theme.primary }]} />
              <TouchableOpacity style={[styles.cameraBadge, { backgroundColor: theme.primary }]} onPress={pickImage}>
                <Feather name="camera" size={14} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.changePhotoText, { color: theme.textSecondary }]}>CHANGE PHOTO</Text>
          </View>

          {/* INPUTS */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>FULL NAME</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="user" size={16} color={theme.textSecondary} style={styles.icon} />
              <TextInput style={[styles.input, { color: theme.text }]} value={formData.fullName} onChangeText={t => setFormData({...formData, fullName: t})} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="mail" size={16} color={theme.textSecondary} style={styles.icon} />
              <TextInput style={[styles.input, { color: theme.text }]} value={formData.email} keyboardType="email-address" autoCapitalize="none" onChangeText={t => setFormData({...formData, email: t})} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PHONE NUMBER</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Feather name="phone" size={16} color={theme.textSecondary} style={styles.icon} />
              <TextInput style={[styles.input, { color: theme.text }]} value={formData.phone} keyboardType="phone-pad" onChangeText={t => setFormData({...formData, phone: t})} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>BIO</Text>
            <View style={[styles.bioContainer, { backgroundColor: theme.inputBg }]}>
              <TextInput style={[styles.bioInput, { color: theme.text }]} value={formData.bio} multiline numberOfLines={4} onChangeText={t => setFormData({...formData, bio: t})} />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <Feather name="check-circle" size={18} color="#111" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#121212' },
  changePhotoText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  bioContainer: { borderRadius: 12, padding: 16, height: 100 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  bioInput: { flex: 1, fontSize: 14, textAlignVertical: 'top' },
  saveButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
  saveButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});