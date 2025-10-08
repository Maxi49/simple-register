
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Button, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, insertarRopa, obtenerRopa } from '@/db/database';

export default function RopaScreen() {
  const [cantidad, setCantidad] = useState('');
  const [genero, setGenero] = useState<'hombre' | 'mujer'>('hombre');
  const [ropa, setRopa] = useState<any[]>([]);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
        loadRopa();
      })
      .catch(err => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  const loadRopa = () => {
    obtenerRopa()
      .then(result => {
        setRopa(result as any[]);
      })
      .catch(err => {
        console.log('Error loading ropa');
        console.log(err);
      });
  };

  const handleInsertarRopa = () => {
    const numCantidad = parseInt(cantidad, 10);
    if (isNaN(numCantidad) || numCantidad <= 0) {
      alert('Por favor, ingrese una cantidad válida.');
      return;
    }

    insertarRopa(numCantidad, genero)
      .then(() => {
        console.log('Ropa insertada');
        setCantidad('');
        loadRopa();
      })
      .catch(err => {
        console.log('Error insertando ropa');
        console.log(err);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Ropa</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        keyboardType="numeric"
        value={cantidad}
        onChangeText={setCantidad}
      />
      <View style={styles.buttonContainer}>
        <Button title="Hombre" onPress={() => setGenero('hombre')} />
        <Button title="Mujer" onPress={() => setGenero('mujer')} />
      </View>
      <Button title="Insertar" onPress={handleInsertarRopa} />
      <View style={styles.listContainer}>
        {ropa.map(item => (
          <Text key={item.id} style={styles.itemText}>{`ID: ${item.id}, Cantidad: ${item.cantidad}, Género: ${item.genero}`}</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  listContainer: {
    marginTop: 20,
  },
  itemText: {
    color: 'white'
  }
});
