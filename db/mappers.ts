import type {
  Actividad,
  ActividadAsistencia,
  ActividadAsistenciaDetalle,
  ActividadHorario,
  DiaSemana,
} from './types';
import { DIA_SEMANA_VALUES } from './types';

/**
 * Normaliza la estructura de horarios descartando entradas incompletas o con días inválidos.
 *
 * @param horarios Lista de horarios provista por Supabase.
 */
export const sanitiseHorarios = (horarios: ActividadHorario[]): ActividadHorario[] =>
  horarios
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

/**
 * Convierte un registro genérico de Supabase en una entidad de actividad.
 *
 * @param row Registro plano obtenido desde la tabla `actividades`.
 */
export const mapActividadRow = (row: Record<string, unknown>): Actividad => {
  const horarios = Array.isArray(row.horarios) ? (row.horarios as ActividadHorario[]) : [];
  return {
    id: row.id as number,
    nombre: String(row.nombre ?? ''),
    horarios: sanitiseHorarios(horarios),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
};

export type ActividadAsistenciaRow = ActividadAsistencia & {
  detalles?: ActividadAsistenciaDetalle[];
};

/**
 * Adapta un registro de asistencia y sus detalles asociados.
 *
 * @param row Registro obtenido desde la tabla `actividad_asistencias`.
 */
export const mapAsistenciaRow = (row: ActividadAsistenciaRow): ActividadAsistencia => ({
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
