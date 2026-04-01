import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Array<{ category: string; amount: number }>;
}

export function FinanceSummaryScreen() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/summary')
      .then(res => setSummary(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#15803d" size="large" /></View>;
  }

  const revenue = summary?.totalRevenue ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const profit = summary?.netProfit ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('finance.summary')}</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderTopColor: '#16a34a' }]}>
          <Text style={styles.statLabel}>{t('finance.totalRevenue')}</Text>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>{revenue.toLocaleString()}</Text>
          <Text style={styles.currency}>RWF</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#dc2626' }]}>
          <Text style={styles.statLabel}>{t('finance.totalExpenses')}</Text>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{expenses.toLocaleString()}</Text>
          <Text style={styles.currency}>RWF</Text>
        </View>
      </View>

      <View style={[styles.netCard, { borderColor: profit >= 0 ? '#16a34a' : '#dc2626' }]}>
        <Text style={styles.netLabel}>{t('finance.netProfit')}</Text>
        <Text style={[styles.netValue, { color: profit >= 0 ? '#16a34a' : '#dc2626' }]}>
          {profit.toLocaleString()} RWF
        </Text>
      </View>

      {(summary?.byCategory ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          {summary!.byCategory.map((c, i) => (
            <View key={i} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{c.category}</Text>
              <Text style={styles.categoryAmount}>{c.amount.toLocaleString()} RWF</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#14532d', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderTopWidth: 3, elevation: 2 },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  currency: { fontSize: 12, color: '#9ca3af' },
  netCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, marginBottom: 16, alignItems: 'center', elevation: 2 },
  netLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  netValue: { fontSize: 28, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  categoryName: { fontSize: 14, color: '#374151' },
  categoryAmount: { fontSize: 14, fontWeight: '500', color: '#374151' },
});
