import { PersonManager } from '@/components/person-manager';
import {
  actualizarAlumno,
  eliminarAlumno,
  insertarAlumno,
  obtenerAlumnos,
} from '@/db/database';

export default function AlumnosScreen() {
  return (
    <PersonManager
      title="Alumnos"
      entityLabel="alumno"
      pluralLabel="alumnos"
      iconName="school-outline"
      subscriptionTable="alumnos"
      fetchAll={obtenerAlumnos}
      onCreate={insertarAlumno}
      onUpdate={actualizarAlumno}
      onDelete={eliminarAlumno}
    />
  );
}
