
import * as SQLite from 'expo-sqlite/legacy';

const db = SQLite.openDatabase('collaborative.db');

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

export const init = (): Promise<boolean> => {
  const promise = new Promise<boolean>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS ropa (id INTEGER PRIMARY KEY NOT NULL, cantidad INTEGER NOT NULL, genero TEXT NOT NULL);',
        [],
        () => { resolve(true); },
        (_, err) => { reject(err); return true; }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS jovenes (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => { resolve(true); },
        (_, err) => { reject(err); return true; }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => { resolve(true); },
        (_, err) => { reject(err); return true; }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS familias (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => { resolve(true); },
        (_, err) => { reject(err); return true; }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS donaciones (id INTEGER PRIMARY KEY NOT NULL, tipo TEXT NOT NULL, cantidad INTEGER NOT NULL);',
        [],
        () => { resolve(true); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const insertarRopa = (cantidad: number, genero: 'hombre' | 'mujer'): Promise<SQLite.SQLResultSet> => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO ropa (cantidad, genero) VALUES (?, ?);',
        [cantidad, genero],
        (_, result) => { resolve(result); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const obtenerRopa = (): Promise<Ropa[]> => {
  const promise = new Promise<Ropa[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM ropa;',
        [],
        (_, result) => { resolve(result.rows._array); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const insertarJoven = (nombre: string, apellido: string): Promise<SQLite.SQLResultSet> => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO jovenes (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => { resolve(result); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const obtenerJovenes = (): Promise<Joven[]> => {
  const promise = new Promise<Joven[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM jovenes;',
        [],
        (_, result) => { resolve(result.rows._array); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const insertarAlumno = (nombre: string, apellido: string): Promise<SQLite.SQLResultSet> => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO alumnos (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => { resolve(result); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const obtenerAlumnos = (): Promise<Alumno[]> => {
  const promise = new Promise<Alumno[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM alumnos;',
        [],
        (_, result) => { resolve(result.rows._array); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const insertarFamilia = (nombre: string, apellido: string): Promise<SQLite.SQLResultSet> => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO familias (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => { resolve(result); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const obtenerFamilias = (): Promise<Familia[]> => {
  const promise = new Promise<Familia[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM familias;',
        [],
        (_, result) => { resolve(result.rows._array); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const insertarDonacion = (tipo: string, cantidad: number): Promise<SQLite.SQLResultSet> => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO donaciones (tipo, cantidad) VALUES (?, ?);',
        [tipo, cantidad],
        (_, result) => { resolve(result); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};

export const obtenerDonaciones = (): Promise<Donacion[]> => {
  const promise = new Promise<Donacion[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM donaciones;',
        [],
        (_, result) => { resolve(result.rows._array); },
        (_, err) => { reject(err); return true; }
      );
    });
  });
  return promise;
};
