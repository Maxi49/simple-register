import * as SQLite from 'expo-sqlite';

const db = (() => {
  if (typeof SQLite.openDatabase !== 'function') {
    throw new Error('No se pudo inicializar la DB: openDatabase no esta disponible.');
  }
  return SQLite.openDatabase('collaborative.db');
})();

// Interfaces para el tipado de datos
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

const createTxErrorHandler =
  (reject: (error: any) => void) =>
  (_tx: SQLite.SQLTransaction, error: SQLite.SQLError): boolean => {
    reject(error);
    return true;
  };

export const init = (): Promise<boolean> =>
  new Promise<boolean>((resolve, reject) => {
    let settled = false;
    const safeResolve = () => {
      if (!settled) {
        settled = true;
        resolve(true);
      }
    };
    const safeReject = (error: any) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    db.transaction(
      tx => {
        const onError = createTxErrorHandler(safeReject);
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS ropa (id INTEGER PRIMARY KEY NOT NULL, cantidad INTEGER NOT NULL, genero TEXT NOT NULL);',
          [],
          undefined,
          onError
        );
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS jovenes (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
          [],
          undefined,
          onError
        );
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
          [],
          undefined,
          onError
        );
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS familias (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
          [],
          undefined,
          onError
        );
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS donaciones (id INTEGER PRIMARY KEY NOT NULL, tipo TEXT NOT NULL, cantidad INTEGER NOT NULL);',
          [],
          undefined,
          onError
        );
      },
      safeReject,
      safeResolve
    );
  });

const runInsert = (sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> =>
  new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    let settled = false;
    const safeResolve = (result: SQLite.SQLResultSet) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
    const safeReject = (error: any) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    db.transaction(
      tx => {
        const onError = createTxErrorHandler(safeReject);
        tx.executeSql(
          sql,
          params,
          (_: SQLite.SQLTransaction, result: SQLite.SQLResultSet) => safeResolve(result),
          onError
        );
      },
      safeReject
    );
  });

const runSelect = <T = any[]>(sql: string, params: any[] = []): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let settled = false;
    const safeResolve = (rows: T) => {
      if (!settled) {
        settled = true;
        resolve(rows);
      }
    };
    const safeReject = (error: any) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    db.transaction(
      tx => {
        const onError = createTxErrorHandler(safeReject);
        tx.executeSql(
          sql,
          params,
          (_: SQLite.SQLTransaction, result: SQLite.SQLResultSet) => {
            const rows = result.rows ? (result.rows._array as T) : ([] as unknown as T);
            safeResolve(rows);
          },
          onError
        );
      },
      safeReject
    );
  });

// Funciones exportadas
export const insertarRopa = (cantidad: number, genero: 'hombre' | 'mujer') =>
  runInsert('INSERT INTO ropa (cantidad, genero) VALUES (?, ?);', [cantidad, genero]);

export const obtenerRopa = () => runSelect<Ropa[]>('SELECT * FROM ropa;');

export const insertarJoven = (nombre: string, apellido: string) =>
  runInsert('INSERT INTO jovenes (nombre, apellido) VALUES (?, ?);', [nombre, apellido]);

export const obtenerJovenes = () => runSelect<Joven[]>('SELECT * FROM jovenes;');

export const insertarAlumno = (nombre: string, apellido: string) =>
  runInsert('INSERT INTO alumnos (nombre, apellido) VALUES (?, ?);', [nombre, apellido]);

export const obtenerAlumnos = () => runSelect<Alumno[]>('SELECT * FROM alumnos;');

export const insertarFamilia = (nombre: string, apellido: string) =>
  runInsert('INSERT INTO familias (nombre, apellido) VALUES (?, ?);', [nombre, apellido]);

export const obtenerFamilias = () => runSelect<Familia[]>('SELECT * FROM familias;');

export const insertarDonacion = (tipo: string, cantidad: number) =>
  runInsert('INSERT INTO donaciones (tipo, cantidad) VALUES (?, ?);', [tipo, cantidad]);

export const obtenerDonaciones = () => runSelect<Donacion[]>('SELECT * FROM donaciones;');
