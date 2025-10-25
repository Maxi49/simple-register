import { supabase } from '../client';
import { logChange } from '../change-log';
import type {
  AppDataSnapshot,
  AsistenciaEstado,
  TableName,
} from '../types';
import { sanitiseHorarios } from '../mappers';

import { ensureNoError, DATA_TABLES } from './utils';
import {
  obtenerActividadAsistenciaDetalleTodas,
  obtenerActividadAsistenciasTodas,
  obtenerActividadAsignaciones,
  obtenerActividades,
} from './activities';
import { obtenerAlumnos, obtenerFamilias, obtenerJovenes } from './people';
import { obtenerDonaciones } from './donations';
import { obtenerRopa } from './clothing';

/**
 * Construye un snapshot completo de todas las tablas relevantes para exportación.
 */
export const obtenerSnapshot = async (): Promise<AppDataSnapshot> => {
  const [
    ropa,
    jovenes,
    alumnos,
    familias,
    donaciones,
    actividadesRaw,
    alumnoActividadesRaw,
    asistenciasRaw,
    asistenciaDetalleRaw,
  ] = await Promise.all([
    obtenerRopa(),
    obtenerJovenes(),
    obtenerAlumnos(),
    obtenerFamilias(),
    obtenerDonaciones(),
    obtenerActividades(),
    obtenerActividadAsignaciones(),
    obtenerActividadAsistenciasTodas(),
    obtenerActividadAsistenciaDetalleTodas(),
  ]);

  const actividades = actividadesRaw.map(({ id, nombre, horarios }) => ({
    ...(id !== undefined ? { id } : {}),
    nombre,
    horarios: sanitiseHorarios(horarios ?? []),
  }));

  const alumno_actividades = alumnoActividadesRaw.map(({ id, actividad_id, alumno_id }) => ({
    ...(id !== undefined ? { id } : {}),
    actividad_id,
    alumno_id,
  }));

  const actividad_asistencias = asistenciasRaw.map(({ id, actividad_id, fecha, hora_inicio, hora_fin, se_dicto }) => ({
    ...(id !== undefined ? { id } : {}),
    actividad_id,
    fecha,
    hora_inicio: hora_inicio ?? null,
    hora_fin: hora_fin ?? null,
    se_dicto: Boolean(se_dicto),
  }));

  const actividad_asistencia_detalle = asistenciaDetalleRaw.map(({ id, asistencia_id, alumno_id, estado }) => ({
    ...(id !== undefined ? { id } : {}),
    asistencia_id,
    alumno_id,
    estado: (estado === 'presente' ? 'presente' : 'ausente') as AsistenciaEstado,
  }));

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

/**
 * Reemplaza por completo el contenido de las tablas administradas con los datos provistos.
 *
 * @param snapshot Conjunto de datos a persistir.
 */
export const reemplazarDatos = async (snapshot: Partial<AppDataSnapshot>) => {
  const data: AppDataSnapshot = {
    ropa: snapshot.ropa ?? [],
    jovenes: snapshot.jovenes ?? [],
    alumnos: snapshot.alumnos ?? [],
    familias: snapshot.familias ?? [],
    donaciones: snapshot.donaciones ?? [],
    actividades: snapshot.actividades ?? [],
    alumno_actividades: snapshot.alumno_actividades ?? [],
    actividad_asistencias: snapshot.actividad_asistencias ?? [],
    actividad_asistencia_detalle: snapshot.actividad_asistencia_detalle ?? [],
  };

  for (const table of DATA_TABLES) {
    const tableData = data[table] as Record<string, unknown>[];
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

  const actividadesRows = data.actividades
    .map(row => {
      const nombre = row.nombre?.trim();
      if (!nombre) {
        return null;
      }
      const record: Record<string, unknown> = {
        nombre,
        horarios: sanitiseHorarios(row.horarios ?? []),
      };
      if (row.id !== undefined) {
        record.id = row.id;
      }
      return record;
    })
    .filter((item): item is Record<string, unknown> => item !== null);

  const alumnoActividadesRows = data.alumno_actividades
    .map(row => {
      if (row.actividad_id === undefined || row.alumno_id === undefined) {
        return null;
      }
      const record: Record<string, unknown> = {
        actividad_id: row.actividad_id,
        alumno_id: row.alumno_id,
      };
      if (row.id !== undefined) {
        record.id = row.id;
      }
      return record;
    })
    .filter((item): item is Record<string, unknown> => item !== null);

  const asistenciasRows = data.actividad_asistencias
    .map(row => {
      if (!row.fecha || row.actividad_id === undefined) {
        return null;
      }
      const record: Record<string, unknown> = {
        actividad_id: row.actividad_id,
        fecha: row.fecha,
        hora_inicio: row.hora_inicio ?? null,
        hora_fin: row.hora_fin ?? null,
        se_dicto: Boolean(row.se_dicto),
      };
      if (row.id !== undefined) {
        record.id = row.id;
      }
      return record;
    })
    .filter((item): item is Record<string, unknown> => item !== null);

  const asistenciaDetalleRows = data.actividad_asistencia_detalle
    .map(row => {
      if (row.asistencia_id === undefined || row.alumno_id === undefined) {
        return null;
      }
      const record: Record<string, unknown> = {
        asistencia_id: row.asistencia_id,
        alumno_id: row.alumno_id,
        estado: (row.estado === 'presente' ? 'presente' : 'ausente') as AsistenciaEstado,
      };
      if (row.id !== undefined) {
        record.id = row.id;
      }
      return record;
    })
    .filter((item): item is Record<string, unknown> => item !== null);

  const inserts: { table: string; rows: Record<string, unknown>[] }[] = [
    { table: 'actividades', rows: actividadesRows },
    { table: 'alumno_actividades', rows: alumnoActividadesRows },
    { table: 'actividad_asistencias', rows: asistenciasRows },
    { table: 'actividad_asistencia_detalle', rows: asistenciaDetalleRows },
  ];

  for (const { table, rows } of inserts) {
    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      ensureNoError(upsertError, `No se pudo importar datos en ${table}`);
    }
    await logChange(table as TableName, 'UPDATE', null, {
      accion: 'bulk-sync',
      total: rows.length,
    });
  }
};
