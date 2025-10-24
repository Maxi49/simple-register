import type { AppDataSnapshot, ActividadHorario, AsistenciaEstado } from '@/db/database';
import { DIA_SEMANA_VALUES } from '@/db/database';

const xlsx: any = require('xlsx');

export type ExportSnapshot = Pick<
  AppDataSnapshot,
  |
    'ropa'
    | 'jovenes'
    | 'alumnos'
    | 'familias'
    | 'donaciones'
    | 'actividades'
    | 'alumno_actividades'
    | 'actividad_asistencias'
    | 'actividad_asistencia_detalle'
>;

const SHEET_NAMES = {
  ropa: 'Ropa',
  jovenes: 'Jovenes',
  alumnos: 'Alumnos',
  familias: 'Familias',
  donaciones: 'Donaciones',
  actividades: 'Actividades',
  alumno_actividades: 'Actividad Alumnos',
  actividad_asistencias: 'Actividad Asistencias',
  actividad_asistencia_detalle: 'Actividad Asistencia Detalle',
} as const;

type RopaSnapshotRow = AppDataSnapshot['ropa'][number];
type PersonSnapshotRow = AppDataSnapshot['jovenes'][number];
type FamiliaSnapshotRow = AppDataSnapshot['familias'][number];
type DonacionSnapshotRow = AppDataSnapshot['donaciones'][number];
type ActividadSnapshotRow = AppDataSnapshot['actividades'][number];
type ActividadAsignacionRow = AppDataSnapshot['alumno_actividades'][number];
type ActividadAsistenciaSnapshotRow = AppDataSnapshot['actividad_asistencias'][number];
type ActividadAsistenciaDetalleSnapshotRow = AppDataSnapshot['actividad_asistencia_detalle'][number];

const normaliseRecord = (row: Record<string, unknown>) => {
  const normalised: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalised[key.toLowerCase()] = value;
  });
  return normalised;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toId = (value: unknown) => {
  const parsed = toNumber(value);
  if (parsed === null) {
    return undefined;
  }
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : undefined;
};

const toText = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim());

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = toText(value).toLowerCase();
  if (!text) {
    return null;
  }
  if (['true', '1', 'si', 'yes', 'y'].includes(text)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(text)) {
    return false;
  }
  return null;
};

const pad = (value: number) => value.toString().padStart(2, '0');

const normaliseDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return trimmed;
  }
  const localMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (localMatch) {
    const [, dd, mm, yyyy] = localMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

const normaliseTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (!match) {
    return null;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) {
    return null;
  }
  const period = match[3]?.toLowerCase();
  if (period) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    if (period === 'am') {
      hour = hour % 12;
    } else {
      hour = hour % 12 + 12;
    }
  }
  if (hour > 23) {
    return null;
  }
  return `${pad(hour)}:${pad(minute)}`;
};

const sanitiseHorarioList = (horarios: ActividadHorario[]): ActividadHorario[] =>
  horarios
    .map(item => ({
      dia: item.dia,
      hora_inicio: item.hora_inicio,
      hora_fin: item.hora_fin,
    }))
    .map(item => {
      const dia = item.dia?.toLowerCase() as (typeof DIA_SEMANA_VALUES)[number];
      if (!DIA_SEMANA_VALUES.includes(dia)) {
        return null;
      }
      const inicio = normaliseTime(item.hora_inicio ?? '');
      const fin = normaliseTime(item.hora_fin ?? '');
      if (!inicio || !fin) {
        return null;
      }
      return { dia, hora_inicio: inicio, hora_fin: fin } satisfies ActividadHorario;
    })
    .filter((item): item is ActividadHorario => item !== null);

const parseHorariosCell = (value: string): ActividadHorario[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as ActividadHorario[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sanitiseHorarioList(parsed);
  } catch {
    return [];
  }
};

const readSheet = (workbook: any, name: string): Record<string, unknown>[] => {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    return [];
  }
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
  return rows.map(normaliseRecord);
};

export const parseSnapshotFromExcel = (base64: string): AppDataSnapshot => {
  const workbook = xlsx.read(base64, { type: 'base64' });

  const ropa: RopaSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.ropa)) {
    const cantidad = toNumber(row.cantidad);
    if (cantidad === null) {
      continue;
    }
    const tipoRaw = toText(row.tipo).toLowerCase();
    const tipo = tipoRaw === 'verano' ? 'verano' : 'invierno';
    const talle = toText(row.talle);
    if (!talle) {
      continue;
    }
    ropa.push({
      id: toId(row.id),
      cantidad,
      tipo,
      talle,
    });
  }

  const parsePersonSheet = (name: string): PersonSnapshotRow[] => {
    const result: PersonSnapshotRow[] = [];
    for (const row of readSheet(workbook, name)) {
      const nombre = toText(row.nombre);
      const apellido = toText(row.apellido);
      if (!nombre || !apellido) {
        continue;
      }
      result.push({
        id: toId(row.id),
        nombre,
        apellido,
      });
    }
    return result;
  };

  const jovenes = parsePersonSheet(SHEET_NAMES.jovenes);
  const alumnos = parsePersonSheet(SHEET_NAMES.alumnos);

  const familias: FamiliaSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.familias)) {
    const apellido = toText(row.apellido);
    const miembros = toNumber(row.miembros);
    if (!apellido || miembros === null) {
      continue;
    }
    familias.push({
      id: toId(row.id),
      apellido,
      miembros,
    });
  }

  const donaciones: DonacionSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.donaciones)) {
    const tipo = toText(row.tipo);
    const cantidad = toNumber(row.cantidad);
    if (!tipo || cantidad === null) {
      continue;
    }
    donaciones.push({
      id: toId(row.id),
      tipo,
      cantidad,
    });
  }

  const actividades: ActividadSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.actividades)) {
    const nombre = toText(row.nombre);
    if (!nombre) {
      continue;
    }
    const horarios = parseHorariosCell(toText(row.horarios));
    actividades.push({
      id: toId(row.id),
      nombre,
      horarios,
    });
  }

  const alumno_actividades: ActividadAsignacionRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.alumno_actividades)) {
    const actividadId = toNumber(row.actividad_id);
    const alumnoId = toNumber(row.alumno_id);
    if (actividadId === null || alumnoId === null) {
      continue;
    }
    alumno_actividades.push({
      id: toId(row.id),
      actividad_id: actividadId,
      alumno_id: alumnoId,
    });
  }

  const actividad_asistencias: ActividadAsistenciaSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.actividad_asistencias)) {
    const actividadId = toNumber(row.actividad_id);
    const fechaText = toText(row.fecha);
    if (actividadId === null || !fechaText) {
      continue;
    }
    const fecha = normaliseDate(fechaText);
    if (!fecha) {
      continue;
    }
    const horaInicio = normaliseTime(toText(row.hora_inicio));
    const horaFin = normaliseTime(toText(row.hora_fin));
    const seDicto = toBoolean(row.se_dicto);
    actividad_asistencias.push({
      id: toId(row.id),
      actividad_id: actividadId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      se_dicto: seDicto ?? false,
    });
  }

  const actividad_asistencia_detalle: ActividadAsistenciaDetalleSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.actividad_asistencia_detalle)) {
    const asistenciaId = toNumber(row.asistencia_id);
    const alumnoId = toNumber(row.alumno_id);
    const estadoRaw = toText(row.estado).toLowerCase();
    if (asistenciaId === null || alumnoId === null) {
      continue;
    }
    const estado: AsistenciaEstado | null = estadoRaw === 'presente' ? 'presente' : estadoRaw === 'ausente' ? 'ausente' : null;
    if (!estado) {
      continue;
    }
    actividad_asistencia_detalle.push({
      id: toId(row.id),
      asistencia_id: asistenciaId,
      alumno_id: alumnoId,
      estado,
    });
  }

  return {
    ropa,
    jovenes,
    alumnos,
    familias,
    donaciones,
    actividades,
    alumno_actividades,
    actividad_asistencias,
    actividad_asistencia_detalle,
  };
};

const toSheet = <T extends Record<string, unknown>>(data: T[], headers: string[]) => {
  if (data.length === 0) {
    return xlsx.utils.aoa_to_sheet([headers]);
  }
  const ordered = data.map(item => {
    const result: Record<string, unknown> = {};
    headers.forEach(header => {
      result[header] = item[header];
    });
    return result;
  });
  return xlsx.utils.json_to_sheet(ordered, { header: headers });
};

export const buildExcelFromSnapshot = (snapshot: ExportSnapshot): string => {
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.ropa.map(item => ({
        id: item.id,
        cantidad: item.cantidad,
        tipo: item.tipo,
        talle: item.talle,
      })),
      ['id', 'cantidad', 'tipo', 'talle']
    ),
    SHEET_NAMES.ropa
  );

  const mapPersonSheet = (data: { id?: number; nombre: string; apellido: string }[]) =>
    toSheet(
      data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        apellido: item.apellido,
      })),
      ['id', 'nombre', 'apellido']
    );

  xlsx.utils.book_append_sheet(workbook, mapPersonSheet(snapshot.jovenes), SHEET_NAMES.jovenes);
  xlsx.utils.book_append_sheet(workbook, mapPersonSheet(snapshot.alumnos), SHEET_NAMES.alumnos);
  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.familias.map(item => ({
        id: item.id,
        apellido: item.apellido,
        miembros: item.miembros,
      })),
      ['id', 'apellido', 'miembros']
    ),
    SHEET_NAMES.familias
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.donaciones.map(item => ({
        id: item.id,
        tipo: item.tipo,
        cantidad: item.cantidad,
      })),
      ['id', 'tipo', 'cantidad']
    ),
    SHEET_NAMES.donaciones
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.actividades.map(item => ({
        id: item.id,
        nombre: item.nombre,
        horarios: JSON.stringify(item.horarios ?? []),
      })),
      ['id', 'nombre', 'horarios']
    ),
    SHEET_NAMES.actividades
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.alumno_actividades.map(item => ({
        id: item.id,
        actividad_id: item.actividad_id,
        alumno_id: item.alumno_id,
      })),
      ['id', 'actividad_id', 'alumno_id']
    ),
    SHEET_NAMES.alumno_actividades
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.actividad_asistencias.map(item => ({
        id: item.id,
        actividad_id: item.actividad_id,
        fecha: item.fecha,
        hora_inicio: item.hora_inicio ?? '',
        hora_fin: item.hora_fin ?? '',
        se_dicto: item.se_dicto ? 'true' : 'false',
      })),
      ['id', 'actividad_id', 'fecha', 'hora_inicio', 'hora_fin', 'se_dicto']
    ),
    SHEET_NAMES.actividad_asistencias
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.actividad_asistencia_detalle.map(item => ({
        id: item.id,
        asistencia_id: item.asistencia_id,
        alumno_id: item.alumno_id,
        estado: item.estado,
      })),
      ['id', 'asistencia_id', 'alumno_id', 'estado']
    ),
    SHEET_NAMES.actividad_asistencia_detalle
  );

  return xlsx.write(workbook, { type: 'base64', bookType: 'xlsx' });
};

export const EXCEL_TEMPLATE_INFO = {
  sheetNames: SHEET_NAMES,
  columns: {
    ropa: ['id', 'cantidad', 'tipo', 'talle'],
    jovenes: ['id', 'nombre', 'apellido'],
    alumnos: ['id', 'nombre', 'apellido'],
    familias: ['id', 'apellido', 'miembros'],
    donaciones: ['id', 'tipo', 'cantidad'],
    actividades: ['id', 'nombre', 'horarios (JSON)'],
    alumno_actividades: ['id', 'actividad_id', 'alumno_id'],
    actividad_asistencias: ['id', 'actividad_id', 'fecha (YYYY-MM-DD)', 'hora_inicio (HH:MM)', 'hora_fin (HH:MM)', 'se_dicto (true/false)'],
    actividad_asistencia_detalle: ['id', 'asistencia_id', 'alumno_id', 'estado (presente/ausente)'],
  },
};

