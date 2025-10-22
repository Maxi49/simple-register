import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTimeField } from '@/components/activity/date-time-field';
import { DIA_SEMANA_VALUES, type ActividadHorario, type DiaSemana } from '@/db/database';
import { timeStringToDisplay } from '@/lib/datetime';

type ActivityScheduleEditorProps = {
  value: ActividadHorario[];
  onChange: (horarios: ActividadHorario[]) => void;
  isDark?: boolean;
};

const DAY_LABELS: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miercoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sabado',
  domingo: 'Domingo',
};

const sortOrder = DIA_SEMANA_VALUES.reduce<Record<DiaSemana, number>>((acc, day, index) => {
  acc[day] = index;
  return acc;
}, {} as Record<DiaSemana, number>);

export function ActivityScheduleEditor({ value, onChange, isDark }: ActivityScheduleEditorProps) {
  const [selectedDays, setSelectedDays] = useState<DiaSemana[]>([]);
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [horaFin, setHoraFin] = useState<string | null>(null);

  const sortedValue = useMemo(() => {
    return [...value].sort((a, b) => {
      const orderDiff = sortOrder[a.dia] - sortOrder[b.dia];
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });
  }, [value]);

  const toggleDay = (day: DiaSemana) => {
    setSelectedDays(prev => (prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]));
  };

  const addHorario = () => {
    if (!horaInicio || !horaFin || selectedDays.length === 0) {
      return;
    }
    const base = value.filter(item => !selectedDays.includes(item.dia));
    const additions = selectedDays.map(dia => ({
      dia,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    }));
    onChange([...base, ...additions]);
    setHoraInicio(null);
    setHoraFin(null);
    setSelectedDays([]);
  };

  const removeHorario = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { color: isDark ? '#cbd5f5' : '#475569' }]}>
        Selecciona los dias y asigna un horario
      </Text>
      <View style={styles.dayRow}>
        {DIA_SEMANA_VALUES.map(day => {
          const active = selectedDays.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: active ? '#2563eb' : isDark ? '#1e293b' : '#e2e8f0',
                  borderColor: active ? '#1d4ed8' : isDark ? '#334155' : '#cbd5f5',
                },
              ]}
            >
              <Text style={[styles.dayChipLabel, { color: active ? '#ffffff' : isDark ? '#e2e8f0' : '#475569' }]}>
                {DAY_LABELS[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
      <Pressable
        onPress={addHorario}
        style={[
          styles.addButton,
          {
            backgroundColor: '#2563eb',
            opacity: horaInicio && horaFin && selectedDays.length > 0 ? 1 : 0.6,
          },
        ]}
      >
        <Text style={styles.addButtonLabel}>Asignar horario</Text>
      </Pressable>

      <View style={styles.scheduleList}>
        {sortedValue.length === 0 ? (
          <Text style={[styles.emptyLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Todavia no agregaste horarios.
          </Text>
        ) : (
          sortedValue.map((item, index) => (
            <View
              key={`${item.dia}-${item.hora_inicio}-${item.hora_fin}-${index}`}
              style={[
                styles.scheduleItem,
                { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5f5' },
              ]}
            >
              <View>
                <Text style={[styles.scheduleTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {DAY_LABELS[item.dia]}
                </Text>
                <Text style={[styles.scheduleSubtitle, { color: isDark ? '#cbd5f5' : '#475569' }]}>
                  {timeStringToDisplay(item.hora_inicio)} Â· {timeStringToDisplay(item.hora_fin)}
                </Text>
              </View>
              <Pressable style={styles.deleteButton} onPress={() => removeHorario(index)}>
                <Text style={styles.deleteButtonLabel}>Eliminar</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dayChipLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  addButtonLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scheduleSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  deleteButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyLabel: {
    fontSize: 14,
  },
});







