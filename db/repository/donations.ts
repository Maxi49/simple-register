import { supabase } from '../client';
import { logChange } from '../change-log';
import type { Donacion } from '../types';

import { ensureData, ensureNoError, listTable } from './utils';

/**
 * Obtiene todas las donaciones registradas.
 */
export const obtenerDonaciones = () => listTable<Donacion>('donaciones');

/**
 * Inserta un registro de donación.
 *
 * @param tipo Descripción o categoría de la donación.
 * @param cantidad Cantidad aportada.
 */
export const insertarDonacion = async (tipo: string, cantidad: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .insert([{ tipo, cantidad }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar donación');
  const inserted = ensureData(data as Donacion | null, 'Respuesta vacía al insertar donación');
  await logChange('donaciones', 'INSERT', inserted.id, inserted);
  return inserted;
};

/**
 * Actualiza los datos de una donación existente.
 */
export const actualizarDonacion = async (id: number, tipo: string, cantidad: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .update({ tipo, cantidad })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar donación');
  const updated = ensureData(data as Donacion | null, 'Respuesta vacía al actualizar donación');
  await logChange('donaciones', 'UPDATE', id, updated);
  return updated;
};

/**
 * Elimina una donación por identificador.
 */
export const eliminarDonacion = async (id: number) => {
  const { data, error } = await supabase
    .from('donaciones')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();
  ensureNoError(error, 'No se pudo eliminar donación');
  const deleted = (data ?? null) as Donacion | null;
  await logChange('donaciones', 'DELETE', id, deleted);
  return deleted;
};
