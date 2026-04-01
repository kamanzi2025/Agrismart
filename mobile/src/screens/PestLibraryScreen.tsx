import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

interface PestEntry {
  id: string;
  name: string;
  scientificName?: string;
  symptoms: string[];
  severity: string;
  controlMethods?: string[];
  preventionTips?: string[];
  description?: string;
}

export function PestLibraryScreen() {
  const navigation = useNavigation<any>();
  const [pests, setPests] = useState<PestEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pest/library')
      .then(res => setPests(res.data.data.pests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = pests.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.scientificName ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const severityBg: Record<string, string> = {
    LOW: '#fef3c7',
    MEDIUM: '#fed7aa',
    HIGH: '#fecaca',
    CRITICAL: '#fca5a5',
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search pests..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading…' : 'No pests found'}</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: severityBg[item.severity] ?? '#fff' }]}
            onPress={() => navigation.navigate('PestDetail', { pest: item })}
          >
            <Text style={styles.pestName}>{item.name}</Text>
            {item.scientificName && (
              <Text style={styles.scientific}>{item.scientificName}</Text>
            )}
            <Text style={styles.severity}>Severity: {item.severity}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  search: { margin: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  card: { borderRadius: 10, padding: 14, elevation: 1 },
  pestName: { fontSize: 16, fontWeight: '600', color: '#14532d' },
  scientific: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 },
  severity: { fontSize: 12, color: '#374151', marginTop: 6 },
});
