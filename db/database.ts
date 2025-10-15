import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type TableName = 'ropa' | 'jovenes' | 'alumnos' | 'familias' | 'donaciones';

export interface Ropa {
  id: number;
  cantidad: number;
  genero: 'hombre' | 'mujer';
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
  nombre: string;
  apellido: string;
}

export interface Donacion {
  id: number;
  tipo: string;
  cantidad: number;
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

export const insertarRopa = async (cantidad: number, genero: 'hombre' | 'mujer') => {
  const { data, error } = await supabase
    .from('ropa')
    .insert([{ cantidad, genero }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar ropa');
  const inserted = ensureData(data as Ropa | null, 'Respuesta vacia al insertar ropa');
  await logChange('ropa', 'INSERT', inserted.id, inserted);
  return inserted;
};

export const actualizarRopa = async (id: number, cantidad: number, genero: 'hombre' | 'mujer') => {
  const { data, error } = await supabase
    .from('ropa')
    .update({ cantidad, genero })
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

const insertPerson = async (table: 'jovenes' | 'alumnos' | 'familias', nombre: string, apellido: string) => {
  const { data, error } = await supabase
    .from(table)
    .insert([{ nombre, apellido }])
    .select()
    .single();
  ensureNoError(error, `No se pudo insertar en ${table}`);
  const inserted = ensureData((data ?? null) as (Joven | Alumno | Familia) | null, 'Respuesta vacia al insertar');
  await logChange(table, 'INSERT', inserted.id, inserted);
  return inserted;
};

const updatePerson = async (
  table: 'jovenes' | 'alumnos' | 'familias',
  id: number,
  nombre: string,
  apellido: string
) => {
  const { data, error } = await supabase
    .from(table)
    .update({ nombre, apellido })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, `No se pudo actualizar en ${table}`);
  const updated = ensureData((data ?? null) as (Joven | Alumno | Familia) | null, 'Respuesta vacia al actualizar');
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

export const insertarFamilia = (nombre: string, apellido: string) => insertPerson('familias', nombre, apellido);
export const actualizarFamilia = (id: number, nombre: string, apellido: string) =>
  updatePerson('familias', id, nombre, apellido);
export const eliminarFamilia = (id: number) => deletePerson('familias', id);

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
