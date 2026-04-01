import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import i18n from '../i18n';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, clearAuth } = useAuthStore();
  const [isRw, setIsRw] = useState(i18n.language === 'rw');

  const toggleLanguage = () => {
    const newLang = isRw ? 'en' : 'rw';
    i18n.changeLanguage(newLang);
    setIsRw(!isRw);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(user?.name ?? 'F')[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      <View style={styles.section}>
        <Row label={t('profile.location')} value={user?.location ?? '—'} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Kinyarwanda</Text>
          <Switch
            value={isRw}
            onValueChange={toggleLanguage}
            trackColor={{ true: '#15803d', false: '#d1d5db' }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#14532d' },
  phone: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  section: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { color: '#374151', fontSize: 14 },
  rowValue: { color: '#6b7280', fontSize: 14 },
  logoutBtn: { marginTop: 24, backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
