import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const buildFitnessYoutubeUrl = (exercise) => {
  const name = String(exercise?.exercise_name || 'golf fitness exercise');
  const query = `${name} golf fitness mobility exercise for golfers`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};

export default function FitnessPrescription({ data }) {
  const exercises = data?.fitness_prescription || [];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>FITNESS PRESCRIPTION</Text>
      {data?.physical_diagnosis ? <Text style={styles.diagnosis}>{String(data.physical_diagnosis)}</Text> : null}
      {exercises.map((exercise, index) => {
        const youtubeUrl = buildFitnessYoutubeUrl(exercise);
        return (
          <View key={`${exercise.exercise_name || 'exercise'}-${index}`} style={styles.card}>
            <Text style={styles.name}>{String(exercise.exercise_name || 'Exercise').toUpperCase()}</Text>
            <Text style={styles.reps}>{String(exercise.sets_and_reps || '')}</Text>
            <Text style={styles.why}>{String(exercise.why_it_helps || '')}</Text>
            <TouchableOpacity style={styles.youtubeBtn} onPress={() => Linking.openURL(youtubeUrl)}>
              <Text style={styles.youtubeText}>WATCH GOLF FITNESS VIDEOS ▶</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, marginBottom: 30 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 20 },
  diagnosis: { color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 15 },
  card: { backgroundColor: '#0A0A0A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#222222', marginBottom: 14 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  reps: { color: '#00FF66', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  why: { color: '#AAAAAA', fontSize: 15, lineHeight: 22 },
  youtubeBtn: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333333' },
  youtubeText: { color: '#FF3B30', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }
});
