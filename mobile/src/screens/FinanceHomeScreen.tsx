import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export function FinanceHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('finance.title')}</Text>

      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#dc2626' }]}
        onPress={() => navigation.navigate('RecordExpense')}
      >
        <Text style={styles.cardEmoji}>💸</Text>
        <View>
          <Text style={styles.cardTitle}>{t('finance.recordExpense')}</Text>
          <Text style={styles.cardSub}>Track your farming costs</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#16a34a' }]}
        onPress={() => navigation.navigate('RecordSale')}
      >
        <Text style={styles.cardEmoji}>💰</Text>
        <View>
          <Text style={styles.cardTitle}>{t('finance.recordSale')}</Text>
          <Text style={styles.cardSub}>Record your harvest sales</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#2563eb' }]}
        onPress={() => navigation.navigate('FinanceSummary')}
      >
        <Text style={styles.cardEmoji}>📊</Text>
        <View>
          <Text style={styles.cardTitle}>{t('finance.summary')}</Text>
          <Text style={styles.cardSub}>View your financial overview</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#14532d', marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  cardSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
