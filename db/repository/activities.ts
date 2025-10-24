import { supabase } from '../client';
import { logChange } from '../change-log';
import {
  Actividad,
  ActividadAsistencia,
  ActividadAsistenciaDetalle,
  ActividadHorario,
  AlumnoActividad,
  AsistenciaEstado,
} from '../types';
import {
  mapActividadRow,
  mapAsistenciaRow,
  sanitiseHorarios,
  type ActividadAsistenciaRow,
} from '../mappers';

import { ensureData, ensureNoError, listTable } from './utils';

/**
 * Obtiene el catálogo de actividades ordenadas alfabéticamente.
 */
export const obtenerActividades = async (): Promise<Actividad[]> => {
  const { data, error } = await supabase
    .from('actividades')
    .select('*')
    .order('nombre', { ascending: true });
  ensureNoError(error, 'No se pudieron obtener las actividades');
  return (data ?? []).map(item => mapActividadRow(item as Record<string, unknown>));
};

/**
 * Recupera la información detallada de una actividad.
 */
export const obtenerActividad = async (id: number): Promise<Actividad> => {
  const { data, error } = await supabase.from('actividades').select('*').eq('id', id).single();
  ensureNoError(error, 'No se pudo obtener la actividad');
  const actividad = ensureData(data as Record<string, unknown> | null, 'Actividad no encontrada');
  return mapActividadRow(actividad);
};

/**
 * Inserta una nueva actividad con sus horarios sanitizados.
 */
export const insertarActividad = async (nombre: string, horarios: ActividadHorario[]) => {
  const payload = sanitiseHorarios(horarios);
  const { data, error } = await supabase
    .from('actividades')
    .insert([{ nombre: nombre.trim(), horarios: payload }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo crear la actividad');
  const inserted = ensureData(data as Record<string, unknown> | null, 'Respuesta vacía al crear actividad');
  const actividad = mapActividadRow(inserted);
  await logChange('actividades', 'INSERT', actividad.id, actividad);
  return actividad;
};

/**
 * Actualiza una actividad existente con nuevos horarios.
 */
export const actualizarActividad = async (id: number, nombre: string, horarios: ActividadHorario[]) => {
  const payload = sanitiseHorarios(horarios);
  const { data, error } = await supabase
    .from('actividades')
    .update({ nombre: nombre.trim(), horarios: payload })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar la actividad');
  const updated = ensureData(data as Record<string, unknown> | null, 'Respuesta vacía al actualizar actividad');
  const actividad = mapActividadRow(updated);
  await logChange('actividades', 'UPDATE', id, actividad);
  return actividad;
};

/**
 * Elimina una actividad por identificador.
 */
export const eliminarActividad = async (id: number) => {
  const { data, error } = await supabase.from('actividades').delete().eq('id', id).select().maybeSingle();
  ensureNoError(error, 'No se pudo eliminar la actividad');
  const deleted = (data ?? null) as Record<string, unknown> | null;
  await logChange('actividades', 'DELETE', id, deleted);
  return deleted;
};

/**
 * Obtiene los identificadores de alumnos asociados a una actividad.
 */
export const obtenerActividadAlumnoIds = async (actividadId: number): Promise<number[]> => {
  const { data, error } = await supabase
    .from('alumno_actividades')
    .select('alumno_id')
    .eq('actividad_id', actividadId);
  ensureNoError(error, 'No se pudieron cargar los alumnos asociados a la actividad');
  return (data ?? []).map(item => item.alumno_id as number);
};

/**
 * Reemplaza las asociaciones entre una actividad y sus alumnos, limpiando asistencias obsoletas.
 */
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

/**
 * Recupera las asistencias de una actividad, incluyendo su detalle.
 */
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

/**
 * Crea un registro de asistencia sin detalle inicial.
 */
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
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacía al crear asistencia');
  await logChange('actividad_asistencias', 'INSERT', asistencia.id, asistencia);
  return mapAsistenciaRow(asistencia);
};

/**
 * Actualiza los datos básicos de una asistencia.
 */
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
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacía al actualizar asistencia');
  await logChange('actividad_asistencias', 'UPDATE', id, asistencia);
  return mapAsistenciaRow(asistencia);
};

/**
 * Elimina un registro de asistencia.
 */
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

/**
 * Marca si una actividad se dictó en una determinada sesión.
 */
export const actualizarAsistenciaSeDicto = async (id: number, seDicto: boolean) => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .update({ se_dicto: seDicto })
    .eq('id', id)
    .select('id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto')
    .single();
  ensureNoError(error, 'No se pudo actualizar el estado de la asistencia');
  const asistencia = ensureData(data as ActividadAsistenciaRow | null, 'Respuesta vacía al actualizar estado');
  await logChange('actividad_asistencias', 'UPDATE', id, asistencia);
  return mapAsistenciaRow(asistencia);
};

/**
 * Guarda el detalle de asistencia para cada alumno asociado.
 *
 * @param asistenciaId Identificador del registro de asistencia.
 * @param detalles Lista de alumnos con su estado de presencia.
 */
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

/**
 * Obtiene todas las asignaciones actividad-alumno sin filtros.
 */
export const obtenerActividadAsignaciones = () => listTable<AlumnoActividad>('alumno_actividades');

/**
 * Obtiene todas las asistencias registradas sin aplicar filtros.
 */
export const obtenerActividadAsistenciasTodas = async (): Promise<ActividadAsistencia[]> => {
  const { data, error } = await supabase
    .from('actividad_asistencias')
    .select('*')
    .order('id', { ascending: true });
  ensureNoError(error, 'No se pudieron obtener las asistencias');
  return (data ?? []) as ActividadAsistencia[];
};

/**
 * Obtiene todo el detalle de asistencia disponible.
 */
export const obtenerActividadAsistenciaDetalleTodas = () =>
  listTable<ActividadAsistenciaDetalle>('actividad_asistencia_detalle');
