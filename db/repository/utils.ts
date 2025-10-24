import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../client';
import type { TableName } from '../types';

/**
 * Tablas primarias utilizadas para la sincronización masiva con snapshots.
 */
export const DATA_TABLES: TableName[] = ['ropa', 'jovenes', 'alumnos', 'familias', 'donaciones'];

/**
 * Lanza una excepción enriquecida cuando Supabase devuelve un error.
 *
 * @param error Error retornado por el SDK de Supabase.
 * @param context Mensaje contextual que facilita el diagnóstico.
 */
export const ensureNoError = (error: PostgrestError | null, context: string) => {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
};

/**
 * Garantiza que un valor no sea nulo o indefinido, devolviéndolo de forma tipada.
 *
 * @param value Valor potencialmente nulo.
 * @param context Mensaje de error a emitir si el valor es inválido.
 */
export const ensureData = <T>(value: T | null | undefined, context: string): T => {
  if (value === null || value === undefined) {
    throw new Error(context);
  }
  return value;
};

/**
 * Obtiene todas las filas de una tabla ordenadas por su identificador.
 *
 * @param table Nombre de la tabla pública de Supabase a consultar.
 */
export const listTable = async <T>(table: TableName): Promise<T[]> => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: true });
  ensureNoError(error, `No se pudo obtener datos de ${table}`);
  return (data ?? []) as T[];
};
