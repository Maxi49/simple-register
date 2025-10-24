export type TableName =
  | 'ropa'
  | 'jovenes'
  | 'alumnos'
  | 'familias'
  | 'donaciones'
  | 'actividades'
  | 'alumno_actividades'
  | 'actividad_asistencias'
  | 'actividad_asistencia_detalle';

export type RopaTemporada = 'invierno' | 'verano';

export interface Ropa {
  id: number;
  cantidad: number;
  tipo: RopaTemporada;
  talle: string;
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
  apellido: string;
  miembros: number;
}

export interface Donacion {
  id: number;
  tipo: string;
  cantidad: number;
}

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface ActividadHorario {
  dia: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
}

export interface Actividad {
  id: number;
  nombre: string;
  horarios: ActividadHorario[];
  created_at?: string;
  updated_at?: string;
}

export type AsistenciaEstado = 'presente' | 'ausente';

export interface AlumnoActividad {
  id: number;
  actividad_id: number;
  alumno_id: number;
}

export interface ActividadAsistencia {
  id: number;
  actividad_id: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  se_dicto: boolean;
  created_at?: string;
  updated_at?: string;
  detalles?: ActividadAsistenciaDetalle[];
}

export interface ActividadAsistenciaDetalle {
  id: number;
  asistencia_id: number;
  alumno_id: number;
  estado: AsistenciaEstado;
}

export const DIA_SEMANA_VALUES: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export type ChangeAction = 'INSERT' | 'UPDATE' | 'DELETE';

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
  actividades: (Omit<Actividad, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Actividad, 'id'>>)[]; 
  alumno_actividades: (Omit<AlumnoActividad, 'id'> & Partial<Pick<AlumnoActividad, 'id'>>)[]; 
  actividad_asistencias: (
    Omit<ActividadAsistencia, 'id' | 'created_at' | 'updated_at' | 'detalles'> &
    Partial<Pick<ActividadAsistencia, 'id'>>
  )[];
  actividad_asistencia_detalle: (
    Omit<ActividadAsistenciaDetalle, 'id'> & Partial<Pick<ActividadAsistenciaDetalle, 'id'>>
  )[];
};
