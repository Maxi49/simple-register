import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from 'react-native';

import { dateStringToDisplay, timeStringToDisplay } from '@/lib/datetime';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  isDark?: boolean;
};

type Period = 'AM' | 'PM';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => (index * 5).toString().padStart(2, '0'));
const MONTHS = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' },
];

export function DateTimeField({ label, mode, value, onChange, placeholder, isDark }: DateTimeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [hour, setHour] = useState<number>(9);
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<Period>('AM');

  const [day, setDay] = useState<number>(new Date().getDate());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const list: number[] = [];
    for (let y = current - 4; y <= current + 4; y += 1) {
      list.push(y);
    }
    return list;
  }, []);

  const maxDay = useMemo(() => daysInMonth(year, month), [year, month]);

  const displayValue = mode === 'time' ? timeStringToDisplay(value) : dateStringToDisplay(value);

  const fieldBackground: ColorValue = isDark ? '#0f172a' : '#ffffff';
  const borderColor: ColorValue = isDark ? '#1e293b' : '#cbd5f5';
  const labelColor: ColorValue = isDark ? '#94a3b8' : '#64748b';
  const textColor: ColorValue = isDark ? '#f8fafc' : '#0f172a';

  const openPicker = () => {
    if (mode === 'time') {
      const parsed = parseTime(value);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    } else {
      const parsed = parseDate(value);
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);
    }
    setVisible(true);
  };

  const handleConfirm = () => {
    if (mode === 'time') {
      const minuteNumber = Number(minute);
      const hour24 = period === 'PM' ? ((hour % 12) + 12) : hour % 12;
      const formatted = `${pad(hour24)}:${pad(minuteNumber)}`;
      onChange(formatted);
    } else {
      const boundedDay = Math.min(day, maxDay);
      const formatted = `${year}-${pad(month)}-${pad(boundedDay)}`;
      onChange(formatted);
    }
    setVisible(false);
  };

  const days = useMemo(() => Array.from({ length: maxDay }, (_, index) => index + 1), [maxDay]);

  const selectionContent =
    mode === 'time'
      ? renderTimeSelector({
          hour,
          minute,
          period,
          onSelectHour: setHour,
          onSelectMinute: setMinute,
          onSelectPeriod: setPeriod,
          isDark,
        })
      : renderDateSelector({
          day,
          month,
          year,
          days,
          years,
          onSelectDay: setDay,
          onSelectMonth: newMonth => {
            setMonth(newMonth);
            setDay(prev => Math.min(prev, daysInMonth(year, newMonth)));
          },
          onSelectYear: newYear => {
            setYear(newYear);
            setDay(prev => Math.min(prev, daysInMonth(newYear, month)));
          },
          isDark,
        });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: fieldBackground, borderColor },
          pressed && styles.fieldPressed,
        ]}
        onPress={openPicker}
      >
        <Text style={[styles.value, { color: value ? textColor : labelColor }]}>
          {value ? displayValue : placeholder ?? (mode === 'time' ? 'Seleccionar hora' : 'Seleccionar fecha')}
        </Text>
      </Pressable>

      {visible ? (
        <Modal transparent animationType="fade" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: fieldBackground, borderColor }]}
              onPress={event => event.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {mode === 'time' ? 'Selecciona la hora' : 'Selecciona la fecha'}
              </Text>
              {selectionContent}
              <View style={styles.modalActions}>
                <Pressable onPress={() => setVisible(false)} style={styles.actionButton}>
                  <Text style={[styles.actionLabel, { color: labelColor }]}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleConfirm} style={styles.actionButton}>
                  <Text style={[styles.actionLabel, { color: '#2563eb' }]}>Confirmar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const renderTimeSelector = ({
  hour,
  minute,
  period,
  onSelectHour,
  onSelectMinute,
  onSelectPeriod,
  isDark,
}: {
  hour: number;
  minute: string;
  period: Period;
  onSelectHour: (value: number) => void;
  onSelectMinute: (value: string) => void;
  onSelectPeriod: (value: Period) => void;
  isDark?: boolean;
}) => (
  <View style={styles.columns}>
    <OptionColumn
      items={HOURS.map(value => ({ key: value.toString(), label: value.toString(), value }))}
      selectedKey={hour.toString()}
      onSelect={item => onSelectHour(item.value)}
      isDark={isDark}
    />
    <OptionColumn
      items={MINUTES.map(value => ({ key: value, label: value, value }))}
      selectedKey={minute}
      onSelect={item => onSelectMinute(item.value)}
      isDark={isDark}
    />
    <View style={styles.periodColumn}>
      {(['AM', 'PM'] as Period[]).map(value => {
        const active = period === value;
        return (
          <Pressable
            key={value}
            style={[
              styles.periodButton,
              {
                backgroundColor: active ? '#2563eb' : isDark ? '#1e293b' : '#e2e8f0',
                borderColor: active ? '#1d4ed8' : isDark ? '#334155' : '#cbd5f5',
              },
            ]}
            onPress={() => onSelectPeriod(value)}
          >
            <Text style={[styles.periodLabel, { color: active ? '#ffffff' : isDark ? '#e2e8f0' : '#475569' }]}>
              {value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const renderDateSelector = ({
  day,
  month,
  year,
  days,
  years,
  onSelectDay,
  onSelectMonth,
  onSelectYear,
  isDark,
}: {
  day: number;
  month: number;
  year: number;
  days: number[];
  years: number[];
  onSelectDay: (value: number) => void;
  onSelectMonth: (value: number) => void;
  onSelectYear: (value: number) => void;
  isDark?: boolean;
}) => (
  <View style={styles.columns}>
    <OptionColumn
      items={days.map(value => ({ key: value.toString(), label: value.toString(), value }))}
      selectedKey={day.toString()}
      onSelect={item => onSelectDay(item.value)}
      isDark={isDark}
      flex={1}
    />
    <OptionColumn
      items={MONTHS.map(item => ({
        key: item.value.toString(),
        label: item.label,
        value: item.value,
      }))}
      selectedKey={month.toString()}
      onSelect={item => onSelectMonth(item.value)}
      isDark={isDark}
      flex={1.2}
    />
    <OptionColumn
      items={years.map(value => ({ key: value.toString(), label: value.toString(), value }))}
      selectedKey={year.toString()}
      onSelect={item => onSelectYear(item.value)}
      isDark={isDark}
      flex={1.2}
    />
  </View>
);

type OptionItem<T> = {
  key: string;
  label: string;
  value: T;
};

const OptionColumn = <T,>({
  items,
  selectedKey,
  onSelect,
  isDark,
  flex = 1,
}: {
  items: OptionItem<T>[];
  selectedKey: string;
  onSelect: (item: OptionItem<T>) => void;
  isDark?: boolean;
  flex?: number;
}) => (
  <ScrollView
    style={[styles.optionColumn, { flex }]}
    contentContainerStyle={styles.optionColumnContent}
    showsVerticalScrollIndicator={false}
  >
    {items.map(item => {
      const active = item.key === selectedKey;
      return (
        <Pressable
          key={item.key}
          style={[
            styles.optionButton,
            {
              backgroundColor: active ? '#2563eb' : isDark ? '#1e293b' : '#e2e8f0',
              borderColor: active ? '#1d4ed8' : isDark ? '#334155' : '#cbd5f5',
            },
          ]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.optionLabel, { color: active ? '#ffffff' : isDark ? '#e2e8f0' : '#475569' }]}>
            {item.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const pad = (value: number) => value.toString().padStart(2, '0');

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const parseTime = (value: string | null) => {
  if (!value) {
    return { hour: 9, minute: '00', period: 'AM' as Period };
  }
  const [hourStr, minuteStr] = value.split(':');
  const hour24 = Number(hourStr);
  const minute = minuteStr?.padStart(2, '0') ?? '00';
  if (Number.isNaN(hour24)) {
    return { hour: 9, minute: '00', period: 'AM' as Period };
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour: hour12, minute, period };
};

const parseDate = (value: string | null) => {
  if (!value) {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const parsedYear = Number(yearStr);
  const parsedMonth = Number(monthStr);
  const parsedDay = Number(dayStr);
  if ([parsedYear, parsedMonth, parsedDay].some(Number.isNaN)) {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }
  return {
    day: parsedDay,
    month: parsedMonth,
    year: parsedYear,
  };
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldPressed: {
    opacity: 0.9,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  columns: {
    flexDirection: 'row',
    gap: 12,
  },
  optionColumn: {
    maxHeight: 200,
    borderRadius: 14,
  },
  optionColumnContent: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  periodColumn: {
    gap: 10,
    justifyContent: 'center',
  },
  periodButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});



