import { supabase } from '../client';
import { logChange } from '../change-log';
import type { Alumno, Familia, Joven } from '../types';

import { ensureData, ensureNoError, listTable } from './utils';

type PersonTable = 'jovenes' | 'alumnos';
type FamilyTable = 'familias';

/**
 * Recupera todos los jóvenes almacenados.
 */
export const obtenerJovenes = () => listTable<Joven>('jovenes');

/**
 * Recupera todos los alumnos registrados.
 */
export const obtenerAlumnos = () => listTable<Alumno>('alumnos');

/**
 * Recupera todas las familias registradas.
 */
export const obtenerFamilias = () => listTable<Familia>('familias');

const insertPerson = async (table: PersonTable, nombre: string, apellido: string) => {
  const { data, error } = await supabase
    .from(table)
    .insert([{ nombre, apellido }])
    .select()
    .single();
  ensureNoError(error, `No se pudo insertar en ${table}`);
  const inserted = ensureData((data ?? null) as (Joven | Alumno) | null, 'Respuesta vacía al insertar');
  await logChange(table, 'INSERT', inserted.id, inserted);
  return inserted;
};

const updatePerson = async (table: PersonTable, id: number, nombre: string, apellido: string) => {
  const { data, error } = await supabase
    .from(table)
    .update({ nombre, apellido })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, `No se pudo actualizar en ${table}`);
  const updated = ensureData((data ?? null) as (Joven | Alumno) | null, 'Respuesta vacía al actualizar');
  await logChange(table, 'UPDATE', id, updated);
  return updated;
};

const deletePerson = async (table: PersonTable | FamilyTable, id: number) => {
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

/**
 * Da de alta un nuevo joven.
 */
export const insertarJoven = (nombre: string, apellido: string) => insertPerson('jovenes', nombre, apellido);

/**
 * Actualiza los datos de un joven existente.
 */
export const actualizarJoven = (id: number, nombre: string, apellido: string) =>
  updatePerson('jovenes', id, nombre, apellido);

/**
 * Elimina un joven por identificador.
 */
export const eliminarJoven = (id: number) => deletePerson('jovenes', id);

/**
 * Registra un nuevo alumno.
 */
export const insertarAlumno = (nombre: string, apellido: string) => insertPerson('alumnos', nombre, apellido);

/**
 * Actualiza los datos de un alumno existente.
 */
export const actualizarAlumno = (id: number, nombre: string, apellido: string) =>
  updatePerson('alumnos', id, nombre, apellido);

/**
 * Elimina un alumno por identificador.
 */
export const eliminarAlumno = (id: number) => deletePerson('alumnos', id);

/**
 * Crea una nueva familia indicando la cantidad de integrantes.
 */
export const insertarFamilia = async (apellido: string, miembros: number) => {
  const { data, error } = await supabase
    .from('familias')
    .insert([{ apellido, miembros }])
    .select()
    .single();
  ensureNoError(error, 'No se pudo insertar familia');
  const inserted = ensureData(data as Familia | null, 'Respuesta vacía al insertar familia');
  await logChange('familias', 'INSERT', inserted.id, inserted);
  return inserted;
};

/**
 * Actualiza los datos de una familia.
 */
export const actualizarFamilia = async (id: number, apellido: string, miembros: number) => {
  const { data, error } = await supabase
    .from('familias')
    .update({ apellido, miembros })
    .eq('id', id)
    .select()
    .single();
  ensureNoError(error, 'No se pudo actualizar familia');
  const updated = ensureData(data as Familia | null, 'Respuesta vacía al actualizar familia');
  await logChange('familias', 'UPDATE', id, updated);
  return updated;
};

/**
 * Elimina una familia registrada.
 */
export const eliminarFamilia = (id: number) => deletePerson('familias', id);
