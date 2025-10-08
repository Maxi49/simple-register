
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Button, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, insertarAlumno, obtenerAlumnos } from '@/db/database';

export default function AlumnosScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [alumnos, setAlumnos] = useState<any[]>([]);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
        loadAlumnos();
      })
      .catch(err => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  const loadAlumnos = () => {
    obtenerAlumnos()
      .then(result => {
        setAlumnos(result as any[]);
      })
      .catch(err => {
        console.log('Error loading alumnos');
        console.log(err);
      });
  };

  const handleInsertarAlumno = () => {
    if (!nombre || !apellido) {
      alert('Por favor, ingrese nombre y apellido.');
      return;
    }

    insertarAlumno(nombre, apellido)
      .then(() => {
        console.log('Alumno insertado');
        setNombre('');
        setApellido('');
        loadAlumnos();
      })
      .catch(err => {
        console.log('Error insertando alumno');
        console.log(err);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Alumnos</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />
      <Button title="Insertar" onPress={handleInsertarAlumno} />
      <View style={styles.listContainer}>
        {alumnos.map(item => (
          <Text key={item.id}>{`ID: ${item.id}, Nombre: ${item.nombre}, Apellido: ${item.apellido}`}</Text>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: 'white'
  },
  listContainer: {
    marginTop: 20,
  },
});
