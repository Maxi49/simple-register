import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { DateTimeField } from '@/components/activity/date-time-field';
import { AppButton } from '@/components/ui/app-button';
import { dateStringToDisplay, timeStringToDisplay } from '@/lib/datetime';
import type { ActividadAsistencia, Alumno, AsistenciaEstado } from '@/db/database';

type AttendanceDetails = Record<number, AsistenciaEstado | undefined>;

type ActivityAttendanceCardProps = {
  asistencia: ActividadAsistencia;
  alumnos: Alumno[];
  detalles: AttendanceDetails;
  onEstadoChange: (alumnoId: number, estado: AsistenciaEstado) => Promise<void> | void;
  onToggleSeDicto: (value: boolean) => Promise<void> | void;
  onGuardarHorario: (fecha: string, horaInicio: string | null, horaFin: string | null) => Promise<void> | void;
  onEliminar: () => Promise<void> | void;
  onMarcarTodos: (estado: AsistenciaEstado) => Promise<void> | void;
  loading?: boolean;
  isDark?: boolean;
};

const estadoLabels: Record<AsistenciaEstado, string> = {
  presente: 'Asistio',
  ausente: 'No asistio',
};

export function ActivityAttendanceCard({
  asistencia,
  alumnos,
  detalles,
  onEstadoChange,
  onToggleSeDicto,
  onGuardarHorario,
  onEliminar,
  onMarcarTodos,
  loading,
  isDark,
}: ActivityAttendanceCardProps) {
  const [fecha, setFecha] = useState(asistencia.fecha);
  const [horaInicio, setHoraInicio] = useState(asistencia.hora_inicio ?? null);
  const [horaFin, setHoraFin] = useState(asistencia.hora_fin ?? null);
  const [savingHorario, setSavingHorario] = useState(false);
  const [togglingClase, setTogglingClase] = useState(false);

  useEffect(() => {
    setFecha(asistencia.fecha);
    setHoraInicio(asistencia.hora_inicio ?? null);
    setHoraFin(asistencia.hora_fin ?? null);
  }, [asistencia.fecha, asistencia.hora_fin, asistencia.hora_inicio]);

  const totalPresentes = useMemo(
    () => Object.values(detalles).filter(value => value === 'presente').length,
    [detalles]
  );

  const displayFecha = dateStringToDisplay(fecha);
  const displayHoraInicio = timeStringToDisplay(horaInicio);
  const displayHoraFin = timeStringToDisplay(horaFin);

  const handleToggleSeDicto = async (value: boolean) => {
    setTogglingClase(true);
    try {
      await onToggleSeDicto(value);
    } finally {
      setTogglingClase(false);
    }
  };

  const handleGuardarHorario = async () => {
    setSavingHorario(true);
    try {
      await onGuardarHorario(fecha, horaInicio, horaFin);
    } finally {
      setSavingHorario(false);
    }
  };

  const handleMarcarTodosPresentes = async () => {
    await onMarcarTodos('presente');
  };

  const containerStyle = [
    styles.card,
    {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderColor: isDark ? '#1e293b' : '#cbd5f5',
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Clase del {displayFecha}</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#cbd5f5' : '#475569' }]}>
            {horaInicio ? displayHoraInicio : 'Sin hora de inicio'}
            {horaFin ? ` · ${displayHoraFin}` : ''}
          </Text>
        </View>
        <AppButton label="Eliminar" variant="danger" onPress={onEliminar} style={styles.headerButton} />
      </View>

      <View style={styles.fieldGroup}>
        <DateTimeField label="Fecha de la clase" mode="date" value={fecha} onChange={value => value && setFecha(value)} isDark={isDark} />
        <View style={styles.timeRow}>
          <DateTimeField
            label="Hora de inicio"
            mode="time"
            value={horaInicio}
            onChange={setHoraInicio}
            isDark={isDark}
          />
          <DateTimeField
            label="Hora de finalizacion"
            mode="time"
            value={horaFin}
            onChange={setHoraFin}
            isDark={isDark}
          />
        </View>
      </View>
      <AppButton
        label="Guardar horario"
        onPress={handleGuardarHorario}
        disabled={savingHorario || loading}
        style={styles.inlineButton}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>¿La clase se dictó?</Text>
        <Switch value={asistencia.se_dicto} onValueChange={handleToggleSeDicto} disabled={togglingClase || loading} />
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#2563eb" style={styles.loader} />
      ) : asistencia.se_dicto ? (
        <View style={styles.attendanceSection}>
          <View style={styles.attendanceHeader}>
            <Text style={[styles.attendanceTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Asistencias ({totalPresentes}/{alumnos.length})
            </Text>
            <Pressable style={styles.markAllButton} onPress={handleMarcarTodosPresentes}>
              <Text style={styles.markAllButtonLabel}>Marcar todos presentes</Text>
            </Pressable>
          </View>
          {alumnos.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              No hay alumnos asignados a la actividad.
            </Text>
          ) : (
            alumnos.map(alumno => {
              const estado = detalles[alumno.id];
              return (
                <View
                  key={alumno.id}
                  style={[
                    styles.studentRow,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.studentName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {alumno.nombre} {alumno.apellido}
                    </Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    {(['presente', 'ausente'] as AsistenciaEstado[]).map(option => {
                      const active = estado === option;
                      return (
                        <Pressable
                          key={option}
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: active ? '#16a34a' : isDark ? '#334155' : '#e2e8f0',
                            },
                          ]}
                          onPress={() => onEstadoChange(alumno.id, option)}
                        >
                          <Text
                            style={[
                              styles.checkboxLabel,
                              { color: active ? '#ffffff' : isDark ? '#e2e8f0' : '#475569' },
                            ]}
                          >
                            {estadoLabels[option]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Marcá la clase como dictada para poder cargar asistencias.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  headerButton: {
    width: 110,
  },
  fieldGroup: {
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineButton: {
    alignSelf: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  loader: {
    marginTop: 8,
  },
  attendanceSection: {
    gap: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  markAllButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
  },
  studentRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkbox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  checkboxLabel: {
    fontWeight: '600',
  },
});
