import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getLocalAdvisories } from '../services/database';

interface Advisory {
  id: string;
  title: string;
  content: string;
  crop_type: string | null;
  season: string | null;
  created_at: string;
}

export function AdvisoryInboxScreen() {
  const { t } = useTranslation();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocalAdvisories()
      .then(setAdvisories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#15803d" size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={advisories}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('advisory.noAdvisories')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.crop_type ?? 'General'}{item.season ? ` · ${item.season}` : ''}
            </Text>
            <Text style={styles.content} numberOfLines={4}>{item.content}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  content: { fontSize: 14, color: '#374151', lineHeight: 20 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
});
