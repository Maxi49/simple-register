import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type TableName =
  | 'ropa'
  | 'jovenes'
  | 'alumnos'
  | 'familias'
  | 'donaciones'
  | 'actividades'
  | 'alumno_actividades'
  | 'actividad_asistencias'
  | 'actividad_asistencia_detalle';

export type RopaTemporada = 'invierno' | 'verano';

export interface Ropa {
  id: number;
  cantidad: number;
  tipo: RopaTemporada;
  talle: string;
}

export interface Joven {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Familia {
  id: number;
  apellido: string;
  miembros: number;
}

export interface Donacion {
  id: number;
  tipo: string;
  cantidad: number;
}

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface ActividadHorario {
  dia: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
}

export interface Actividad {
  id: number;
  nombre: string;
  horarios: ActividadHorario[];
  created_at?: string;
  updated_at?: string;
}

export type AsistenciaEstado = 'presente' | 'ausente';

export interface AlumnoActividad {
  id: number;
  actividad_id: number;
  alumno_id: number;
}

export interface ActividadAsistencia {
  id: number;
  actividad_id: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  se_dicto: boolean;
  created_at?: string;
  updated_at?: string;
  detalles?: ActividadAsistenciaDetalle[];
}

export interface ActividadAsistenciaDetalle {
  id: number;
  asistencia_id: number;
  alumno_id: number;
  estado: AsistenciaEstado;
}

type ChangeAction = 'INSERT' | 'UPDATE' | 'DELETE';

export type ChangeLogEntry = {
  id: number;
  tabla: TableName;
  accion: ChangeAction;
  registro_id: number | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type AppDataSnapshot = {
  ropa: (Omit<Ropa, 'id'> & Partial<Pick<Ropa, 'id'>>)[];
  jovenes: (Omit<Joven, 'id'> & Partial<Pick<Joven, 'id'>>)[];
  alumnos: (Omit<Alumno, 'id'> & Partial<Pick<Alumno, 'id'>>)[];
  familias: (Omit<Familia, 'id'> & Partial<Pick<Familia, 'id'>>)[];
  donaciones: (Omit<Donacion, 'id'> & Partial<Pick<Donacion, 'id'>>)[];
};

const DATA_TABLES: TableName[] = ['ropa', 'jovenes', 'alumnos', 'familias', 'donaciones'];
const CHANGE_LOG_TABLE = 'registro_cambios';

let changeLogWarningShown = false;
let changeLogFetchWarningShown = false;

const ensureNoError = (error: PostgrestError | null, context: string) => {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
};

const ensureData = <T>(value: T | null | undefined, context: string): T => {
  if (value === null || value === undefined) {
    throw new Error(context);
  }
  return value;
};

const normalisePayload = (payload: unknown): Record<string, unknown> | null => {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === 'object') {
    try {
      return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return { value: payload as string | number | boolean };
};

export const DIA_SEMANA_VALUES: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const sanitiseHorarios = (horarios: ActividadHorario[]): ActividadHorario[] => {
  return horarios
    .map(item => {
      const dia = item.dia.toLowerCase() as DiaSemana;
      if (!DIA_SEMANA_VALUES.includes(dia)) {
        return null;
      }
      const horaInicio = String(item.hora_inicio ?? '').trim();
      const horaFin = String(item.hora_fin ?? '').trim();
      if (!horaInicio || !horaFin) {
        return null;
      }
      return {
        dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      };
    })
    .filter((value): value is ActividadHorario => value !== null);
};

const logChange = async (
  table: TableName,
  action: ChangeAction,
  recordId: number | null,
  payload: unknown
) => {
  const { error } = await supabase.from(CHANGE_LOG_TABLE).insert({
    tabla: table,
    accion: action,
    registro_id: recordId,
    payload: normalisePayload(payload),
  });
  if (error && !changeLogWarningShown) {
    changeLogWarningShown = true;
    console.warn(
      'No se pudo registrar el cambio en Supabase. Verifica que exista la tabla "registro_cambios" con columnas (tabla, accion, registro_id, payload, created_at).'
    );
  }
};

const listTable = async <T>(table: TableName) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: true });
  ensureNoError(error, `No se pudo obtener datos de ${table}`);
  return (data ?? []) as T[];
};

export const init = async (): Promise<boolean> => {
  const { error } = await supabase.from('donaciones').select('id').limit(1);
  ensureNoError(error, 'Error al conectar con Supabase');
  return true;
};

export const obtenerRopa = () => listTable<Ropa>('ropa');
export const obtenerJovenes = () => listTable<Joven>('jovenes');
export const obtenerAlumnos = () => listTable<Alumno>('alumnos');
export const obtenerFamilias = () => listTable<Familia>('familias');
export const obtenerDonaciones = () => listTable<Donacion>('donaciones');

export const insertarRopa = async (cantidad: number, tipo: RopaTemporada, talle: string) => {
  const { data, error } = await supabase
    .from('ropa')
    .insert([{ cantidad, tipo, talle }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar ropa');
  const inserted = ensureData(data as Ropa | null, 'Respuesta vacia al insertar ropa');
  await logChange('ropa', 'INSERT', inserted.id, inserted);
  return inserted;
};

export const actualizarRopa = async (id: number, cantidad: number, tipo: RopaTemporada, talle: string) => {
  const { data, error } = await supabase
    .from('ropa')
    .update({ cantidad, tipo, talle })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar ropa');
  const updated = ensureData(data as Ropa | null, 'Respuesta vacia al actualizar ropa');
  await logChange('ropa', 'UPDATE', id, updated);
  return updated;
};

export const eliminarRopa = async (id: number) => {
  const { data, error } = await supabase
    .from('ropa')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();
  ensureNoError(error, 'No se pudo eliminar ropa');
  const deleted = (data ?? null) as Ropa | null;
  await logChange('ropa', 'DELETE', id, deleted);
  return deleted;
};

const insertPerson = async (table: 'jovenes' | 'alumnos', nombre: string, apellido: string) => {
  const { data, error } = await supabase
    .from(table)
    .insert([{ nombre, apellido }])
    .select()
    .single();
  ensureNoError(error, `No se pudo insertar en ${table}`);
  const inserted = ensureData((data ?? null) as (Joven | Alumno) | null, 'Respuesta vacia al insertar');
  await logChange(table, 'INSERT', inserted.id, inserted);
  return inserted;
};

const updatePerson = async (table: 'jovenes' | 'alumnos', id: number, nombre: string, apellido: string) => {
  const { data, error } = await supabase
    .from(table)
    .update({ nombre, apellido })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, `No se pudo actualizar en ${table}`);
  const updated = ensureData((data ?? null) as (Joven | Alumno) | null, 'Respuesta vacia al actualizar');
  await logChange(table, 'UPDATE', id, updated);
  return updated;
};

const deletePerson = async (table: 'jovenes' | 'alumnos' | 'familias', id: number) => {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();
  ensureNoError(error, `No se pudo eliminar en ${table}`);
  const deleted = (data ?? null) as Joven | Alumno | Familia | null;
  await logChange(table, 'DELETE', id, deleted);
  return deleted;
};

export const insertarJoven = (nombre: string, apellido: string) => insertPerson('jovenes', nombre, apellido);
export const actualizarJoven = (id: number, nombre: string, apellido: string) =>
  updatePerson('jovenes', id, nombre, apellido);
export const eliminarJoven = (id: number) => deletePerson('jovenes', id);

export const insertarAlumno = (nombre: string, apellido: string) => insertPerson('alumnos', nombre, apellido);
export const actualizarAlumno = (id: number, nombre: string, apellido: string) =>
  updatePerson('alumnos', id, nombre, apellido);
export const eliminarAlumno = (id: number) => deletePerson('alumnos', id);

export const insertarFamilia = async (apellido: string, miembros: number) => {
  const { data, error } = await supabase
    .from('familias')
    .insert([{ apellido, miembros }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar familia');
  const inserted = ensureData(data as Familia | null, 'Respuesta vacia al insertar familia');
  await logChange('familias', 'INSERT', inserted.id, inserted);
  return inserted;
};

export const actualizarFamilia = async (id: number, apellido: string, miembros: number) => {
  const { data, error } = await supabase
    .from('familias')
    .update({ apellido, miembros })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar familia');
  const updated = ensureData(data as Familia | null, 'Respuesta vacia al actualizar familia');
  await logChange('familias', 'UPDATE', id, updated);
  return updated;
};
export const eliminarFamilia = (id: number) => deletePerson('familias', id);

const mapActividadRow = (row: Record<string, unknown>): Actividad => {
  const horarios = Array.isArray(row.horarios) ? (row.horarios as ActividadHorario[]) : [];
  return {
    id: row.id as number,
    nombre: String(row.nombre ?? ''),
    horarios: sanitiseHorarios(horarios),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
};

export const obtenerActividades = async (): Promise<Actividad[]> => {
  const { data, error } = await supabase
    .from('actividades')
    .select('*')
    .order('nombre', { ascending: true });
  ensureNoError(error, 'No se pudieron obtener las actividades');
  return (data ?? []).map(item => mapActividadRow(item as Record<string, unknown>));
};

export const obtenerActividad = async (id: number): Promise<Actividad> => {
  const { data, error } = await supabase.from('actividades').select('*').eq('id', id).single();
  ensureNoError(error, 'No se pudo obtener la actividad');
  const actividad = ensureData(data as Record<string, unknown> | null, 'Actividad no encontrada');
  return mapActividadRow(actividad);
};

export const insertarActividad = async (nombre: string, horarios: ActividadHorario[]) => {
  const payload = sanitiseHorarios(horarios);
  const { data, error } = await supabase
    .from('actividades')
    .insert([{ nombre: nombre.trim(), horarios: payload }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo crear la actividad');
  const inserted = ensureData(data as Record<string, unknown> | null, 'Respuesta vacia al crear actividad');
  const actividad = mapActividadRow(inserted);
  await logChange('actividades', 'INSERT', actividad.id, actividad);
  return actividad;
};

export const actualizarActividad = async (id: number, nombre: string, horarios: ActividadHorario[]) => {
  const payload = sanitiseHorarios(horarios);
  const { data, error } = await supabase
    .from('actividades')
    .update({ nombre: nombre.trim(), horarios: payload })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar la actividad');
  const updated = ensureData(data as Record<string, unknown> | null, 'Respuesta vacia al actualizar actividad');
  const actividad = mapActividadRow(updated);
  await logChange('actividades', 'UPDATE', id, actividad);
  return actividad;
};

export const eliminarActividad = async (id: number) => {
  const { data, error } = await supabase.from('actividades').delete().eq('id', id).select().maybeSingle();
  ensureNoError(error, 'No se pudo eliminar la actividad');
  const deleted = (data ?? null) as Record<string, unknown> | null;
  await logChange('actividades', 'DELETE', id, deleted);
  return deleted;
};

export const obtenerActividadAlumnoIds = async (actividadId: number): Promise<number[]> => {
  const { data, error } = await supabase
    .from('alumno_actividades')
    .select('alumno_id')
    .eq('actividad_id', actividadId);
  ensureNoError(error, 'No se pudieron cargar los alumnos asociados a la actividad');
  return (data ?? []).map(item => item.alumno_id as number);
};

export const actualizarActividadAlumnos = async (actividadId: number, alumnoIds: number[]) => {
  const { data: existing, error: fetchError } = await supabase
    .from('alumno_actividades')
    .select('alumno_id')
    .eq('actividad_id', actividadId);
  ensureNoError(fetchError, 'No se pudieron obtener las asignaciones actuales');

  const existingIds = new Set((existing ?? []).map(row => row.alumno_id as number));
  const desiredIds = new Set(alumnoIds);

  const toInsert = alumnoIds.filter(id => !existingIds.has(id));
  const toRemove = (existing ?? []).map(row => row.alumno_id as number).filter(id => !desiredIds.has(id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('alumno_actividades').insert(
      toInsert.map(alumnoId => ({
        actividad_id: actividadId,
        alumno_id: alumnoId,
      }))
    );
    ensureNoError(insertError, 'No se pudieron asociar alumnos a la actividad');
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('alumno_actividades')
      .delete()
      .eq('actividad_id', actividadId)
      .in('alumno_id', toRemove);
    ensureNoError(deleteError, 'No se pudieron quitar alumnos de la actividad');

    const { data: asistencias, error: asistenciasError } = await supabase
      .from('actividad_asistencias')
      .select('id')
      .eq('actividad_id', actividadId);
    ensureNoError(asistenciasError, 'No se pudieron obtener las asistencias vinculadas a la actividad');
    const asistenciaIds = (asistencias ?? []).map(row => row.id as number);
    if (asistenciaIds.length > 0) {
      const { error: deleteDetailError } = await supabase
        .from('actividad_asistencia_detalle')
        .delete()
        .in('asistencia_id', asistenciaIds)
        .in('alumno_id', toRemove);
      ensureNoError(deleteDetailError, 'No se pudieron limpiar las asistencias de los alumnos removidos');
    }
  }

  await logChange('alumno_actividades', 'UPDATE', actividadId, {
    actividad_id: actividadId,
    total_alumnos: alumnoIds.length,
  });
};

type ActividadAsistenciaRow = ActividadAsistencia & {
  detalles?: ActividadAsistenciaDetalle[];
};

const mapAsistenciaRow = (row: ActividadAsistenciaRow): ActividadAsistencia => ({
  id: row.id,
  actividad_id: row.actividad_id,
  fecha: row.fecha,
  hora_inicio: row.hora_inicio,
  hora_fin: row.hora_fin,
  se_dicto: row.se_dicto,
  created_at: row.created_at,
  updated_at: row.updated_at,
  detalles: row.detalles ?? [],
});

export const obtenerActividadAsistencias = async (actividadId: number): Promise<ActividadAsistencia[]> => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .select(
      'id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto, detalles:actividad_asistencia_detalle(id, asistencia_id, alumno_id, estado)'
    )
    .eq('actividad_id', actividadId)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false, nullsFirst: false });
  ensureNoError(error, 'No se pudieron obtener las asistencias de la actividad');
  return (data ?? []).map(item => mapAsistenciaRow(item as ActividadAsistenciaRow));
};

export const crearActividadAsistencia = async (
  actividadId: number,
  fecha: string,
  horaInicio: string | null,
  horaFin: string | null
) => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .insert([{ actividad_id: actividadId, fecha, hora_inicio: horaInicio, hora_fin: horaFin, se_dicto: false }])
    .select('id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto')
    .single();
  ensureNoError(error, 'No se pudo crear el registro de asistencia');
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacia al crear asistencia');
  await logChange('actividad_asistencias', 'INSERT', asistencia.id, asistencia);
  return mapAsistenciaRow(asistencia);
};

export const actualizarActividadAsistencia = async (
  id: number,
  fecha: string,
  horaInicio: string | null,
  horaFin: string | null
) => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .update({ fecha, hora_inicio: horaInicio, hora_fin: horaFin })
    .eq('id', id)
    .select('id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto')
    .single();
  ensureNoError(error, 'No se pudo actualizar la asistencia');
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacia al actualizar asistencia');
  await logChange('actividad_asistencias', 'UPDATE', id, asistencia);
  return mapAsistenciaRow(asistencia);
};

export const eliminarActividadAsistencia = async (id: number) => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .delete()
    .eq('id', id)
    .select('id, actividad_id')
    .maybeSingle();
  ensureNoError(error, 'No se pudo eliminar la asistencia');
  const deleted = (data ?? null) as ActividadAsistenciaRow | null;
  await logChange('actividad_asistencias', 'DELETE', id, deleted);
  return deleted;
};

export const actualizarAsistenciaSeDicto = async (id: number, seDicto: boolean) => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .update({ se_dicto: seDicto })
    .eq('id', id)
    .select('id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto')
    .single();
  ensureNoError(error, 'No se pudo actualizar el estado de la asistencia');
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacia al actualizar estado');
  await logChange('actividad_asistencias', 'UPDATE', id, asistencia);
  return mapAsistenciaRow(asistencia);
};

export const guardarAsistenciaDetalle = async (
  asistenciaId: number,
  detalles: { alumnoId: number; estado: AsistenciaEstado }[]
) => {
  if (detalles.length === 0) {
    return;
  }

  const payload = detalles.map(item => ({
    asistencia_id: asistenciaId,
    alumno_id: item.alumnoId,
    estado: item.estado,
  }));

  const { error } = await supabase
    .from('actividad_asistencia_detalle')
    .upsert(payload, { onConflict: 'asistencia_id,alumno_id' });
  ensureNoError(error, 'No se pudo guardar el detalle de asistencia');

  await logChange('actividad_asistencia_detalle', 'UPDATE', asistenciaId, {
    asistencia_id: asistenciaId,
    total_detalles: detalles.length,
  });
};

export const insertarDonacion = async (tipo: string, cantidad: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .insert([{ tipo, cantidad }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar donacion');
  const inserted = ensureData(data as Donacion | null, 'Respuesta vacia al insertar donacion');
  await logChange('donaciones', 'INSERT', inserted.id, inserted);
  return inserted;
};

export const actualizarDonacion = async (id: number, tipo: string, cantidad: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .update({ tipo, cantidad })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar donacion');
  const updated = ensureData(data as Donacion | null, 'Respuesta vacia al actualizar donacion');
  await logChange('donaciones', 'UPDATE', id, updated);
  return updated;
};

export const eliminarDonacion = async (id: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();
  ensureNoError(error, 'No se pudo eliminar donacion');
  const deleted = (data ?? null) as Donacion | null;
  await logChange('donaciones', 'DELETE', id, deleted);
  return deleted;
};

export const obtenerSnapshot = async (): Promise<AppDataSnapshot> => {
  const [ropa, jovenes, alumnos, familias, donaciones] = await Promise.all([
    obtenerRopa(),
    obtenerJovenes(),
    obtenerAlumnos(),
    obtenerFamilias(),
    obtenerDonaciones(),
  ]);

  return {
    ropa,
    jovenes,
    alumnos,
    familias,
    donaciones,
  };
};

export const reemplazarDatos = async (snapshot: Partial<AppDataSnapshot>) => {
  const data: AppDataSnapshot = {
    ropa: snapshot.ropa ?? [],
    jovenes: snapshot.jovenes ?? [],
    alumnos: snapshot.alumnos ?? [],
    familias: snapshot.familias ?? [],
    donaciones: snapshot.donaciones ?? [],
  };

  for (const table of DATA_TABLES) {
    const tableData = data[table];
    const { error: deleteError } = await supabase.from(table).delete().neq('id', -1);
    ensureNoError(deleteError, `No se pudo limpiar la tabla ${table}`);

    if (tableData.length > 0) {
      const { error: upsertError } = await supabase
        .from(table)
        .upsert(tableData as Record<string, unknown>[], { onConflict: 'id' });
      ensureNoError(upsertError, `No se pudo importar datos en ${table}`);
    }

    await logChange(table, 'UPDATE', null, {
      accion: 'bulk-sync',
      total: tableData.length,
    });
  }
};

export const obtenerRegistroCambios = async (limit = 50): Promise<ChangeLogEntry[]> => {
  const { data, error } = await supabase
    .from(CHANGE_LOG_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (!changeLogFetchWarningShown) {
      changeLogFetchWarningShown = true;
      console.warn(
        'No se pudo obtener el historial de cambios. Asegurate de crear la tabla "registro_cambios" en Supabase.'
      );
    }
    return [];
  }

  return data ?? [];
};

export const subscribeToTable = (table: TableName, callback: () => void) => {
  const channel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToTables = (tables: TableName[], callback: () => void) => {
  const unsubscribers = tables.map(table => subscribeToTable(table, callback));
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

export const subscribeToChangeLog = (callback: () => void) => {
  const channel = supabase
    .channel(`public:${CHANGE_LOG_TABLE}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: CHANGE_LOG_TABLE }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
