import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { savePestReport } from '../services/database';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

export function PestDiagnosisScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePestReport({
        clientUuid: uuidv4(),
        farmerId: user.id,
        imageUri: imageUri ?? undefined,
        notes: notes || undefined,
      });
      Alert.alert(t('pest.submitted'));
      setImageUri(null);
      setNotes('');
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Photo</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
          <Text style={styles.photoBtnText}>{t('pest.takePhoto')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
          <Text style={styles.photoBtnText}>{t('pest.choosePhoto')}</Text>
        </TouchableOpacity>
      </View>
      {imageUri && (
        <Text style={styles.imageSelected}>Image selected</Text>
      )}

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Describe what you see..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>{t('pest.reportPest')}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, alignItems: 'center' },
  photoBtnText: { color: '#374151', fontWeight: '500' },
  imageSelected: { color: '#15803d', marginTop: 8, fontWeight: '500' },
  textarea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 100 },
  submitBtn: { backgroundColor: '#15803d', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
