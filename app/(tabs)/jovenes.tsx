
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Button, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, insertarJoven, obtenerJovenes, Joven } from '@/db/database';

export default function JovenesScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [jovenes, setJovenes] = useState<Joven[]>([]);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
        loadJovenes();
      })
      .catch(err => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  const loadJovenes = () => {
    obtenerJovenes()
      .then(result => {
        setJovenes(result);
      })
      .catch(err => {
        console.log('Error loading jovenes');
        console.log(err);
      });
  };

  const handleInsertarJoven = () => {
    if (!nombre || !apellido) {
      alert('Por favor, ingrese nombre y apellido.');
      return;
    }

    insertarJoven(nombre, apellido)
      .then(() => {
        console.log('Joven insertado');
        setNombre('');
        setApellido('');
        loadJovenes();
      })
      .catch(err => {
        console.log('Error insertando joven');
        console.log(err);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Jóvenes</ThemedText>
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
      <Button title="Insertar" onPress={handleInsertarJoven} />
      <View style={styles.listContainer}>
        {jovenes.map(item => (
          <Text key={item.id} style={styles.itemText}>{`ID: ${item.id}, Nombre: ${item.nombre}, Apellido: ${item.apellido}`}</Text>
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
  itemText: {
    color: 'white'
  }
});
