
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Button, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, insertarFamilia, obtenerFamilias } from '@/db/database';

export default function FamiliasScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [familias, setFamilias] = useState<any[]>([]);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
        loadFamilias();
      })
      .catch(err => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  const loadFamilias = () => {
    obtenerFamilias()
      .then(result => {
        setFamilias(result as any[]);
      })
      .catch(err => {
        console.log('Error loading familias');
        console.log(err);
      });
  };

  const handleInsertarFamilia = () => {
    if (!nombre || !apellido) {
      alert('Por favor, ingrese nombre y apellido.');
      return;
    }

    insertarFamilia(nombre, apellido)
      .then(() => {
        console.log('Familia insertada');
        setNombre('');
        setApellido('');
        loadFamilias();
      })
      .catch(err => {
        console.log('Error insertando familia');
        console.log(err);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Familias</ThemedText>
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
      <Button title="Insertar" onPress={handleInsertarFamilia} />
      <View style={styles.listContainer}>
        {familias.map(item => (
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
