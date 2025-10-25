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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ActivityAttendanceCard } from '@/components/activity/activity-attendance-card';
import { ActivityScheduleEditor } from '@/components/activity/activity-schedule-editor';
import { DateTimeField } from '@/components/activity/date-time-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import {
  Actividad,
  ActividadAsistencia,
  ActividadHorario,
  Alumno,
  AsistenciaEstado,
  actualizarActividad,
  actualizarActividadAlumnos,
  actualizarActividadAsistencia,
  actualizarAsistenciaSeDicto,
  crearActividadAsistencia,
  eliminarActividadAsistencia,
  guardarAsistenciaDetalle,
  obtenerActividad,
  obtenerActividadAlumnoIds,
  obtenerActividadAsistencias,
  obtenerAlumnos,
  subscribeToTables,
} from '@/db/database';

type AttendanceLoadingMap = Record<number, boolean>;

const compareHorarios = (a: ActividadHorario[], b: ActividadHorario[]) =>
  JSON.stringify(a) === JSON.stringify(b);

const compareIdSets = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every(id => setA.has(id));
};

export default function ActividadDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const actividadId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [nombre, setNombre] = useState('');
  const [horarios, setHorarios] = useState<ActividadHorario[]>([]);
  const [savingActividad, setSavingActividad] = useState(false);

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
  const [originalAlumnoIds, setOriginalAlumnoIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [searchAlumno, setSearchAlumno] = useState('');

  const [asistencias, setAsistencias] = useState<ActividadAsistencia[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState<AttendanceLoadingMap>({});
  const [newFecha, setNewFecha] = useState<string | null>(null);
  const [newHoraInicio, setNewHoraInicio] = useState<string | null>(null);
  const [newHoraFin, setNewHoraFin] = useState<string | null>(null);
  const [creatingSesion, setCreatingSesion] = useState(false);

  const setAsistenciaLoading = (asistenciaId: number, value: boolean) => {
    setAttendanceLoading(prev => ({ ...prev, [asistenciaId]: value }));
  };

  const loadData = useCallback(async () => {
    if (!actividadId) {
      return;
    }
    setLoading(true);
    try {
      const [actividadData, alumnosData, alumnoIds, asistenciasData] = await Promise.all([
        obtenerActividad(actividadId),
        obtenerAlumnos(),
        obtenerActividadAlumnoIds(actividadId),
        obtenerActividadAsistencias(actividadId),
      ]);
      setActividad(actividadData);
      setNombre(actividadData.nombre);
      setHorarios(actividadData.horarios);
      setAlumnos(alumnosData);
      setSelectedAlumnos(alumnoIds);
      setOriginalAlumnoIds(alumnoIds);
      setAsistencias(asistenciasData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar la actividad.');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    if (!actividadId) {
      Alert.alert('Actividad no encontrada', 'Regresaremos al listado.', [
        {
          text: 'Aceptar',
          onPress: () => router.replace('/(tabs)/actividades'),
        },
      ]);
      return;
    }
    loadData().catch(err => console.error('No se pudo cargar la actividad', err));
  }, [actividadId, loadData, router]);

  useEffect(() => {
    if (!actividadId) {
      return;
    }
    const unsubscribe = subscribeToTables(
      ['actividades', 'alumno_actividades', 'actividad_asistencias', 'actividad_asistencia_detalle'],
      () => {
        loadData().catch(err => console.error('No se pudo refrescar la actividad', err));
      }
    );
    return () => {
      unsubscribe();
    };
  }, [actividadId, loadData]);

  const actividadCambiosPendientes =
    actividad !== null && (actividad.nombre !== nombre || !compareHorarios(actividad.horarios, horarios));

  const asignacionesPendientes = !compareIdSets(selectedAlumnos, originalAlumnoIds);

  const filteredAlumnos = useMemo(() => {
    if (!searchAlumno.trim()) {
      return alumnos;
    }
    const term = searchAlumno.trim().toLowerCase();
    return alumnos.filter(alumno => `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(term));
  }, [alumnos, searchAlumno]);

  const asistenciaDetallesMap = useMemo(() => {
    const map = new Map<number, Record<number, AsistenciaEstado>>();
    asistencias.forEach(asistenciaItem => {
      const detailState: Record<number, AsistenciaEstado> = {};
      (asistenciaItem.detalles ?? []).forEach(detalle => {
        detailState[detalle.alumno_id] = detalle.estado;
      });
      map.set(asistenciaItem.id, detailState);
    });
    return map;
  }, [asistencias]);

  const toggleAlumno = (alumnoId: number) => {
    setSelectedAlumnos(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(idValue => idValue !== alumnoId);
      }
      return [...prev, alumnoId];
    });
  };

  const guardarDatosActividad = async () => {
    if (!actividad || !actividadId) {
      return;
    }
    const trimmedName = nombre.trim();
    if (!trimmedName) {
      Alert.alert('Datos incompletos', 'Ingresa un nombre para la actividad.');
      return;
    }
    if (horarios.length === 0) {
      Alert.alert('Datos incompletos', 'Agrega al menos un horario.');
      return;
    }
    setSavingActividad(true);
    try {
      const updated = await actualizarActividad(actividadId, trimmedName, horarios);
      setActividad(updated);
      Alert.alert('Actividad actualizada', 'Los cambios se guardaron correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSavingActividad(false);
    }
  };

  const guardarAsignaciones = async () => {
    if (!actividadId) {
      return;
    }
    setAssigning(true);
    try {
      await actualizarActividadAlumnos(actividadId, selectedAlumnos);
      setOriginalAlumnoIds(selectedAlumnos);
      Alert.alert('Asignaciones actualizadas', 'Los alumnos fueron asociados correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron actualizar las asignaciones.');
    } finally {
      setAssigning(false);
    }
  };

  const crearSesion = async () => {
    if (!actividadId) {
      return;
    }
    if (!newFecha) {
      Alert.alert('Fecha requerida', 'Selecciona la fecha de la clase.');
      return;
    }
    setCreatingSesion(true);
    try {
      const nueva = await crearActividadAsistencia(actividadId, newFecha, newHoraInicio, newHoraFin);
      setAsistencias(prev => [nueva, ...prev]);
      setNewFecha(null);
      setNewHoraInicio(null);
      setNewHoraFin(null);
      Alert.alert('Sesion creada', 'La clase fue agregada correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear la clase.');
    } finally {
      setCreatingSesion(false);
    }
  };

  const actualizarEstadoDetalle = (asistenciaId: number, alumnoId: number, estado: AsistenciaEstado) => {
    setAsistencias(prev =>
      prev.map(item => {
        if (item.id !== asistenciaId) {
          return item;
        }
        const detalles = item.detalles ? [...item.detalles] : [];
        const index = detalles.findIndex(detail => detail.alumno_id === alumnoId);
        const updatedDetalle = {
          id: index >= 0 ? detalles[index].id : alumnoId,
          asistencia_id: asistenciaId,
          alumno_id: alumnoId,
          estado,
        };
        if (index >= 0) {
          detalles[index] = updatedDetalle;
        } else {
          detalles.push(updatedDetalle);
        }
        return {
          ...item,
          detalles,
        };
      })
    );
  };

  const setSeDictoLocal = (asistenciaId: number, seDicto: boolean) => {
    setAsistencias(prev =>
      prev.map(item => (item.id === asistenciaId ? { ...item, se_dicto: seDicto } : item))
    );
  };

  const setHorarioLocal = (asistenciaId: number, fecha: string, horaInicio: string | null, horaFin: string | null) => {
    setAsistencias(prev =>
      prev.map(item =>
        item.id === asistenciaId
          ? { ...item, fecha, hora_inicio: horaInicio, hora_fin: horaFin }
          : item
      )
    );
  };

  const removeAsistenciaLocal = (asistenciaId: number) => {
    setAsistencias(prev => prev.filter(item => item.id !== asistenciaId));
  };

  const handleEstadoChange = async (asistenciaId: number, alumnoId: number, estado: AsistenciaEstado) => {
    setAsistenciaLoading(asistenciaId, true);
    try {
      await guardarAsistenciaDetalle(asistenciaId, [{ alumnoId, estado }]);
      actualizarEstadoDetalle(asistenciaId, alumnoId, estado);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la asistencia.');
    } finally {
      setAsistenciaLoading(asistenciaId, false);
    }
  };

  const handleToggleSeDicto = async (asistenciaId: number, value: boolean) => {
    setAsistenciaLoading(asistenciaId, true);
    try {
      await actualizarAsistenciaSeDicto(asistenciaId, value);
      setSeDictoLocal(asistenciaId, value);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la clase.');
    } finally {
      setAsistenciaLoading(asistenciaId, false);
    }
  };

  const handleGuardarHorario = async (
    asistenciaId: number,
    fecha: string,
    horaInicio: string | null,
    horaFin: string | null
  ) => {
    setAsistenciaLoading(asistenciaId, true);
    try {
      await actualizarActividadAsistencia(asistenciaId, fecha, horaInicio, horaFin);
      setHorarioLocal(asistenciaId, fecha, horaInicio, horaFin);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la información de la clase.');
    } finally {
      setAsistenciaLoading(asistenciaId, false);
    }
  };

  const handleEliminarAsistencia = async (asistenciaId: number) => {
    setAsistenciaLoading(asistenciaId, true);
    try {
      await eliminarActividadAsistencia(asistenciaId);
      removeAsistenciaLocal(asistenciaId);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo eliminar la clase.');
    } finally {
      setAsistenciaLoading(asistenciaId, false);
    }
  };

  const handleMarcarTodos = async (asistenciaId: number, estado: AsistenciaEstado) => {
    if (selectedAlumnos.length === 0) {
      Alert.alert('Sin alumnos', 'Asocia alumnos a la actividad para registrar la asistencia.');
      return;
    }
    setAsistenciaLoading(asistenciaId, true);
    try {
      await guardarAsistenciaDetalle(
        asistenciaId,
        selectedAlumnos.map(alumnoId => ({ alumnoId, estado }))
      );
      selectedAlumnos.forEach(alumnoId => actualizarEstadoDetalle(asistenciaId, alumnoId, estado));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la asistencia de todos los alumnos.');
    } finally {
      setAsistenciaLoading(asistenciaId, false);
    }
  };

  if (!actividadId || loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </ThemedView>
    );
  }

  if (!actividad) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No se encontró la actividad solicitada.</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Datos de la actividad
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de la actividad"
            placeholderTextColor="#94a3b8"
          />
          <ActivityScheduleEditor value={horarios} onChange={setHorarios} isDark={isDark} />
          <AppButton
            label="Guardar cambios"
            onPress={guardarDatosActividad}
            disabled={!actividadCambiosPendientes || savingActividad}
          />
        </SectionCard>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Asociar alumnos
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Buscar alumno"
            placeholderTextColor="#94a3b8"
            value={searchAlumno}
            onChangeText={setSearchAlumno}
          />
          <View style={styles.assignmentList}>
            {filteredAlumnos.length === 0 ? (
              <Text style={styles.emptyText}>No hay alumnos que coincidan con la búsqueda.</Text>
            ) : (
              filteredAlumnos.map(alumno => {
                const selected = selectedAlumnos.includes(alumno.id);
                return (
                  <View
                    key={alumno.id}
                    style={[styles.assignmentRow, isDark && styles.assignmentRowDark]}
                  >
                    <View>
                      <Text style={[styles.assignmentName, isDark && styles.assignmentNameDark]}>
                        {alumno.nombre} {alumno.apellido}
                      </Text>
                    </View>
                    <AppButton
                      label={selected ? 'Quitar' : 'Agregar'}
                      variant={selected ? 'secondary' : 'primary'}
                      onPress={() => toggleAlumno(alumno.id)}
                      style={styles.assignmentButton}
                    />
                  </View>
                );
              })
            )}
          </View>
          <AppButton
            label="Guardar asignaciones"
            onPress={guardarAsignaciones}
            disabled={!asignacionesPendientes || assigning}
          />
        </SectionCard>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Sesiones y asistencias
            </ThemedText>
          </View>
          <View style={styles.newSessionForm}>
            <DateTimeField
              label="Fecha de la clase"
              mode="date"
              value={newFecha}
              onChange={setNewFecha}
              placeholder="Seleccionar fecha"
              isDark={isDark}
            />
            <View style={styles.newSessionRow}>
              <DateTimeField
                label="Hora inicio"
                mode="time"
                value={newHoraInicio}
                onChange={setNewHoraInicio}
                isDark={isDark}
              />
              <DateTimeField
                label="Hora fin"
                mode="time"
                value={newHoraFin}
                onChange={setNewHoraFin}
                isDark={isDark}
              />
            </View>
            <AppButton label="Agregar clase" onPress={crearSesion} disabled={creatingSesion} />
          </View>

          {asistencias.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Todavia no registraste clases para esta actividad.
            </Text>
          ) : (
            <View style={styles.attendanceList}>
              {asistencias.map(asistenciaItem => (
                <ActivityAttendanceCard
                  key={asistenciaItem.id}
                  asistencia={asistenciaItem}
                  alumnos={alumnos.filter(alumno => selectedAlumnos.includes(alumno.id))}
                  detalles={asistenciaDetallesMap.get(asistenciaItem.id) ?? {}}
                  onEstadoChange={(alumnoId, estado) => handleEstadoChange(asistenciaItem.id, alumnoId, estado)}
                  onToggleSeDicto={value => handleToggleSeDicto(asistenciaItem.id, value)}
                  onGuardarHorario={(fecha, horaInicio, horaFin) =>
                    handleGuardarHorario(asistenciaItem.id, fecha, horaInicio, horaFin)
                  }
                  onEliminar={() => handleEliminarAsistencia(asistenciaItem.id)}
                  onMarcarTodos={estado => handleMarcarTodos(asistenciaItem.id, estado)}
                  loading={attendanceLoading[asistenciaItem.id]}
                  isDark={isDark}
                />
              ))}
            </View>
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
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    rowGap: 16,
    paddingBottom: 48,
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
  assignmentList: {
    gap: 10,
    marginBottom: 12,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  assignmentRowDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  assignmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  assignmentNameDark: {
    color: '#f8fafc',
  },
  assignmentButton: {
    width: 120,
  },
  newSessionForm: {
    marginBottom: 16,
  },
  newSessionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallInput: {
    flex: 1,
  },
  attendanceList: {
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});
