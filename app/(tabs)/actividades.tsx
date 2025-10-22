import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ActivityScheduleEditor } from '@/components/activity/activity-schedule-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import {
  Actividad,
  ActividadHorario,
  init,
  insertarActividad,
  eliminarActividad,
  obtenerActividades,
  subscribeToTable,
} from '@/db/database';

const formatSchedule = (horarios: ActividadHorario[]) => {
  if (horarios.length === 0) {
    return 'Sin horarios cargados';
  }
  return horarios
    .map(item => `${item.dia.charAt(0).toUpperCase() + item.dia.slice(1)} ${item.hora_inicio} - ${item.hora_fin}`)
    .join(' · ');
};

export default function ActividadesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Actividad[]>([]);
  const [nombre, setNombre] = useState('');
  const [horarios, setHorarios] = useState<ActividadHorario[]>([]);

  const refresh = useCallback(async () => {
    const items = await obtenerActividades();
    setActivities(items);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await init();
        if (!active) {
          return;
        }
        await refresh();
      } catch (error) {
        console.error(error);
        if (active) {
          Alert.alert('Error', 'No se pudieron cargar las actividades.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    const unsubscribe = subscribeToTable('actividades', () => {
      refresh().catch(err => console.error('No se pudo actualizar actividades en tiempo real', err));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const resetForm = () => {
    setNombre('');
    setHorarios([]);
  };

  const handleCreate = async () => {
    const trimmedName = nombre.trim();
    if (!trimmedName) {
      Alert.alert('Datos incompletos', 'Ingresa un nombre para la actividad.');
      return;
    }
    if (horarios.length === 0) {
      Alert.alert('Datos incompletos', 'Agrega al menos un horario.');
      return;
    }

    setSaving(true);
    try {
      await insertarActividad(trimmedName, horarios);
      Alert.alert('Actividad creada', 'La actividad se registró correctamente.');
      resetForm();
      await refresh();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear la actividad.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (actividad: Actividad) => {
    Alert.alert(
      'Eliminar actividad',
      `¿Querés eliminar "${actividad.nombre}"? Esta acción también eliminará sus asistencias.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarActividad(actividad.id);
              await refresh();
              Alert.alert('Actividad eliminada', 'La actividad se eliminó correctamente.');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar la actividad.');
            }
          },
        },
      ]
    );
  };

  const contentPaddingTop = useMemo(() => Math.max(insets.top, 16) + 68, [insets.top]);

  return (
    <ThemedView style={[styles.container, { paddingTop: contentPaddingTop }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Ionicons name="calendar-outline" size={32} color={isDark ? '#60a5fa' : '#2563eb'} style={styles.headerIcon} />
          <ThemedText type="title" style={styles.title}>
            Actividades
          </ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Crea actividades con sus horarios, asigna alumnos y llevá el seguimiento de las asistencias.
        </ThemedText>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Nueva actividad
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Nombre de la actividad"
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
          />
          <ActivityScheduleEditor value={horarios} onChange={setHorarios} isDark={isDark} />
          <AppButton label="Crear actividad" onPress={handleCreate} disabled={saving} />
          {saving && <ActivityIndicator size="small" color="#2563eb" style={styles.loader} />}
        </SectionCard>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Actividades registradas
            </ThemedText>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Todavía no hay actividades creadas.</Text>
            </View>
          ) : (
            activities.map(actividad => (
              <View key={actividad.id} style={[styles.activityCard, isDark && styles.activityCardDark]}>
                <View style={styles.activityHeader}>
                  <Text style={[styles.activityName, isDark && styles.activityNameDark]}>{actividad.nombre}</Text>
                  <Text style={[styles.activitySchedule, isDark && styles.activityScheduleDark]}>
                    {formatSchedule(actividad.horarios)}
                  </Text>
                </View>
                <View style={styles.activityActions}>
                  <AppButton
                    label="Ver detalle"
                    onPress={() => router.push(`/actividades/${actividad.id}`)}
                    style={styles.inlineButton}
                  />
                  <AppButton
                    label="Eliminar"
                    variant="secondary"
                    onPress={() => handleDelete(actividad)}
                    style={styles.inlineButton}
                  />
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollContent: {
    rowGap: 16,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    marginBottom: 0,
  },
  description: {
    marginBottom: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  loader: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 15,
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
    gap: 12,
  },
  activityCardDark: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activityHeader: {
    gap: 6,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  activityNameDark: {
    color: '#f8fafc',
  },
  activitySchedule: {
    fontSize: 14,
    color: '#475569',
  },
  activityScheduleDark: {
    color: '#cbd5f5',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineButton: {
    flex: 1,
    marginVertical: 0,
  },
});
