import { supabase } from './client';
import type { ChangeAction, ChangeLogEntry, TableName } from './types';

const CHANGE_LOG_TABLE = 'registro_cambios';

let changeLogWarningShown = false;
let changeLogFetchWarningShown = false;

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

/**
 * Registra en la bitácora cualquier modificación realizada sobre una tabla de Supabase.
 *
 * @param table Tabla afectada.
 * @param action Tipo de operación realizada.
 * @param recordId Identificador del registro modificado (si aplica).
 * @param payload Datos relevantes para reconstruir el cambio.
 */
export const logChange = async (
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

/**
 * Obtiene las últimas entradas del registro de cambios.
 *
 * @param limit Cantidad máxima de eventos a recuperar (por defecto 50).
 */
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
        'No se pudo obtener el historial de cambios. Asegúrate de crear la tabla "registro_cambios" en Supabase.'
      );
    }
    return [];
  }

  return data ?? [];
};

/**
 * Suscribe un callback a cualquier cambio sobre una tabla pública de Supabase.
 *
 * @param table Nombre de la tabla a escuchar.
 * @param callback Acción a ejecutar cuando se detecta una modificación.
 */
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

/**
 * Registra un mismo callback sobre múltiples tablas y devuelve un destructor común.
 *
 * @param tables Tablas a observar.
 * @param callback Acción a ejecutar ante cualquier cambio.
 */
export const subscribeToTables = (tables: TableName[], callback: () => void) => {
  const unsubscribers = tables.map(table => subscribeToTable(table, callback));
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Suscribe un callback a los cambios del registro histórico.
 *
 * @param callback Acción a ejecutar cuando se registra un nuevo evento en la bitácora.
 */
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
