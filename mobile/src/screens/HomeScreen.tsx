import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { pendingCount, lastSyncedAt, isSyncing } = useSyncStore();
  const isOnline = useNetworkStatus();

  const actions = [
    { label: t('home.plantingAdvisory'), screen: 'AdvisoryInbox', color: '#16a34a', emoji: '🌱' },
    { label: t('home.pestDiagnosis'), screen: 'PestDiagnosis', color: '#dc2626', emoji: '🐛' },
    { label: t('home.finance'), screen: 'FinanceHome', color: '#2563eb', emoji: '💰' },
    { label: t('home.soilManagement'), screen: 'SoilManagement', color: '#92400e', emoji: '🌍' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('common.offline')}</Text>
        </View>
      )}

      {/* Greeting */}
      <Text style={styles.greeting}>{t('home.greeting', { name: user?.name ?? '' })}</Text>

      {/* Sync status */}
      <View style={styles.syncRow}>
        <Text style={styles.syncText}>
          {isSyncing
            ? t('common.syncing')
            : lastSyncedAt
            ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}`
            : 'Not synced yet'}
        </Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
      <View style={styles.grid}>
        {actions.map(({ label, screen, color, emoji }) => (
          <TouchableOpacity
            key={screen}
            style={[styles.card, { borderTopColor: color }]}
            onPress={() => navigation.navigate(screen)}
          >
            <Text style={styles.cardEmoji}>{emoji}</Text>
            <Text style={styles.cardLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginBottom: 12 },
  offlineText: { color: '#92400e', textAlign: 'center', fontWeight: '500' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#14532d', marginBottom: 4 },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  syncText: { fontSize: 12, color: '#6b7280', flex: 1 },
  badge: { backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#92400e', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    width: '47%', borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
});
