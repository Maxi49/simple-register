import { supabase } from './client';
import { ensureNoError } from './repository/utils';

export {
  obtenerRopa,
  insertarRopa,
  actualizarRopa,
  eliminarRopa,
} from './repository/clothing';

export {
  obtenerJovenes,
  obtenerAlumnos,
  obtenerFamilias,
  insertarJoven,
  actualizarJoven,
  eliminarJoven,
  insertarAlumno,
  actualizarAlumno,
  eliminarAlumno,
  insertarFamilia,
  actualizarFamilia,
  eliminarFamilia,
} from './repository/people';

export {
  obtenerActividades,
  obtenerActividad,
  insertarActividad,
  actualizarActividad,
  eliminarActividad,
  obtenerActividadAlumnoIds,
  actualizarActividadAlumnos,
  obtenerActividadAsistencias,
  crearActividadAsistencia,
  actualizarActividadAsistencia,
  eliminarActividadAsistencia,
  actualizarAsistenciaSeDicto,
  guardarAsistenciaDetalle,
  obtenerActividadAsignaciones,
  obtenerActividadAsistenciasTodas,
  obtenerActividadAsistenciaDetalleTodas,
} from './repository/activities';

export {
  obtenerDonaciones,
  insertarDonacion,
  actualizarDonacion,
  eliminarDonacion,
} from './repository/donations';

export { obtenerSnapshot, reemplazarDatos } from './repository/snapshot';

/**
 * Verifica conectividad con Supabase ejecutando un select simple.
 */
export const init = async (): Promise<boolean> => {
  const { error } = await supabase.from('donaciones').select('id').limit(1);
  ensureNoError(error, 'Error al conectar con Supabase');
  return true;
};
