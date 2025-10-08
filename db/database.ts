
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('collaborative.db');

export const init = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS ropa (id INTEGER PRIMARY KEY NOT NULL, cantidad INTEGER NOT NULL, genero TEXT NOT NULL);',
        [],
        () => {
          resolve(true);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS jovenes (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => {
          resolve(true);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS alumnos (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => {
          resolve(true);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS familias (id INTEGER PRIMARY KEY NOT NULL, nombre TEXT NOT NULL, apellido TEXT NOT NULL);',
        [],
        () => {
          resolve(true);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS donaciones (id INTEGER PRIMARY KEY NOT NULL, tipo TEXT NOT NULL, cantidad INTEGER NOT NULL);',
        [],
        () => {
          resolve(true);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const insertarRopa = (cantidad: number, genero: 'hombre' | 'mujer') => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO ropa (cantidad, genero) VALUES (?, ?);',
        [cantidad, genero],
        (_, result) => {
          resolve(result);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const obtenerRopa = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM ropa;',
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const insertarJoven = (nombre: string, apellido: string) => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO jovenes (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => {
          resolve(result);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const obtenerJovenes = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM jovenes;',
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const insertarAlumno = (nombre: string, apellido: string) => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO alumnos (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => {
          resolve(result);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const obtenerAlumnos = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM alumnos;',
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const insertarFamilia = (nombre: string, apellido: string) => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO familias (nombre, apellido) VALUES (?, ?);',
        [nombre, apellido],
        (_, result) => {
          resolve(result);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const obtenerFamilias = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM familias;',
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const insertarDonacion = (tipo: string, cantidad: number) => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO donaciones (tipo, cantidad) VALUES (?, ?);',
        [tipo, cantidad],
        (_, result) => {
          resolve(result);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};

export const obtenerDonaciones = () => {
  const promise = new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM donaciones;',
        [],
        (_, result) => {
          resolve(result.rows._array);
        },
        (_, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
  return promise;
};
