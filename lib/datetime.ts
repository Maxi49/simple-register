/**
 * Utilidades para manejar formato de fechas y horarios.
 */

const pad = (value: number) => value.toString().padStart(2, '0');

export const timeStringToDisplay = (value: string | null | undefined) => {
  if (!value) {
    return 'Seleccionar hora';
  }
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 'Seleccionar hora';
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${pad(minute)} ${period}`;
};

export const dateStringToDisplay = (value: string | null | undefined) => {
  if (!value) {
    return 'Seleccionar fecha';
  }
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return 'Seleccionar fecha';
  }
  return `${day}-${month}-${year}`;
};

export const timeStringToDate = (value: string | null | undefined) => {
  const now = new Date();
  if (!value) {
    now.setHours(9, 0, 0, 0);
    return now;
  }
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    now.setHours(9, 0, 0, 0);
    return now;
  }
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const dateStringToDate = (value: string | null | undefined) => {
  if (!value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  if ([year, month, day].some(Number.isNaN)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const dateToTimeString = (value: Date) => `${pad(value.getHours())}:${pad(value.getMinutes())}`;

export const dateToDateString = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
