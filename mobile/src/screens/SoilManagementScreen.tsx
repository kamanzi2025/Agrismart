import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export function SoilManagementScreen() {
  const { t } = useTranslation();

  const recommendations = [
    { label: 'Optimal pH for beans', value: '6.0 – 7.0' },
    { label: 'Apply lime if pH < 5.5', value: '2 tons/ha' },
    { label: 'Nitrogen (N)', value: '20 kg/ha at planting' },
    { label: 'Phosphorus (P)', value: '40 kg/ha' },
    { label: 'Potassium (K)', value: '30 kg/ha' },
    { label: 'Organic matter', value: '> 3% recommended' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('soil.title')}</Text>
      <Text style={styles.subtitle}>Bean cultivation recommendations for East African soils</Text>

      {recommendations.map((r, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.value}>{r.value}</Text>
        </View>
      ))}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🌱 Soil Preparation Tips</Text>
        <Text style={styles.infoText}>
          {'• Conduct soil test before planting\n'}
          {'• Deep plough to 25–30 cm\n'}
          {'• Add compost (5 tons/ha) for organic matter\n'}
          {'• Ensure good drainage to prevent waterlogging\n'}
          {'• Rotate crops to maintain soil health'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#14532d', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 8, elevation: 1 },
  label: { fontSize: 14, color: '#374151', flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: '#15803d' },
  infoCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 16, marginTop: 12 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
