import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

export function PestDetailScreen() {
  const route = useRoute<any>();
  const pest = route.params?.pest;

  if (!pest) {
    return <View style={styles.center}><Text>No data</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{pest.name}</Text>
      {pest.scientificName && <Text style={styles.scientific}>{pest.scientificName}</Text>}

      {(pest.symptoms ?? []).length > 0 && (
        <Section title="Symptoms">
          {(pest.symptoms as string[]).map((s, i) => (
            <Text key={i} style={styles.bullet}>• {s}</Text>
          ))}
        </Section>
      )}

      {(pest.controlMethods ?? []).length > 0 && (
        <Section title="Control Methods">
          {(pest.controlMethods as string[]).map((c, i) => (
            <Text key={i} style={styles.bullet}>• {c}</Text>
          ))}
        </Section>
      )}

      {(pest.preventionTips ?? []).length > 0 && (
        <Section title="Prevention Tips">
          {(pest.preventionTips as string[]).map((p, i) => (
            <Text key={i} style={styles.bullet}>• {p}</Text>
          ))}
        </Section>
      )}

      {pest.description && (
        <Section title="Description">
          <Text style={styles.description}>{pest.description}</Text>
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#14532d' },
  scientific: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginTop: 4 },
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, marginLeft: 4 },
  description: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
