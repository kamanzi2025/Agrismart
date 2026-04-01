import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { saveFinancialRecord } from '../services/database';
import { useAuthStore } from '../store/authStore';

export function RecordSaleScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || !description || !user) return;
    setSaving(true);
    try {
      await saveFinancialRecord({
        clientUuid: uuidv4(),
        farmerId: user.id,
        type: 'SALE',
        amount: parseFloat(amount),
        description,
        season: season || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Saved', 'Sale recorded. Will sync when online.');
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{t('finance.amount')}</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Amount in RWF" />

      <Text style={styles.label}>{t('finance.description')}</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="What did you sell?" />

      <Text style={styles.label}>{t('finance.season')}</Text>
      <TextInput style={styles.input} value={season} onChangeText={setSeason} placeholder="e.g. Season A 2025" />

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
  saveBtn: { backgroundColor: '#15803d', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
