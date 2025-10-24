import { supabase } from '../client';
import { logChange } from '../change-log';
import type { Ropa, RopaTemporada } from '../types';

import { ensureData, ensureNoError, listTable } from './utils';

/**
 * Obtiene el listado completo de prendas de ropa registradas.
 */
export const obtenerRopa = () => listTable<Ropa>('ropa');

/**
 * Crea un registro de ropa y lo documenta en el registro de cambios.
 *
 * @param cantidad Cantidad de unidades disponibles.
 * @param tipo Temporada a la que pertenece la prenda.
 * @param talle Identificador del talle o medida.
 */
export const insertarRopa = async (cantidad: number, tipo: RopaTemporada, talle: string) => {
  const { data, error } = await supabase
    .from('ropa')
    .insert([{ cantidad, tipo, talle }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar ropa');
  const inserted = ensureData(data as Ropa | null, 'Respuesta vacía al insertar ropa');
  await logChange('ropa', 'INSERT', inserted.id, inserted);
  return inserted;
};

/**
 * Actualiza un registro de ropa existente.
 *
 * @param id Identificador de la prenda.
 * @param cantidad Cantidad disponible.
 * @param tipo Temporada asociada.
 * @param talle Talle actualizado.
 */
export const actualizarRopa = async (id: number, cantidad: number, tipo: RopaTemporada, talle: string) => {
  const { data, error } = await supabase
    .from('ropa')
    .update({ cantidad, tipo, talle })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar ropa');
  const updated = ensureData(data as Ropa | null, 'Respuesta vacía al actualizar ropa');
  await logChange('ropa', 'UPDATE', id, updated);
  return updated;
};

/**
 * Elimina una prenda y devuelve el registro eliminado en caso de existir.
 *
 * @param id Identificador de la prenda.
 */
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
