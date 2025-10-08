
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, TextInput, Button, View, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, insertarDonacion, obtenerDonaciones } from '@/db/database';

export default function DonacionesScreen() {
  const [tipo, setTipo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [donaciones, setDonaciones] = useState<any[]>([]);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
        loadDonaciones();
      })
      .catch(err => {
        console.log('Database initialization failed');
        console.log(err);
      });
  }, []);

  const loadDonaciones = () => {
    obtenerDonaciones()
      .then(result => {
        setDonaciones(result as any[]);
      })
      .catch(err => {
        console.log('Error loading donaciones');
        console.log(err);
      });
  };

  const handleInsertarDonacion = () => {
    const numCantidad = parseInt(cantidad, 10);
    if (isNaN(numCantidad) || numCantidad <= 0) {
      alert('Por favor, ingrese una cantidad válida.');
      return;
    }

    if (!tipo) {
      alert('Por favor, ingrese un tipo de donación.');
      return;
    }

    insertarDonacion(tipo, numCantidad)
      .then(() => {
        console.log('Donación insertada');
        setTipo('');
        setCantidad('');
        loadDonaciones();
      })
      .catch(err => {
        console.log('Error insertando donación');
        console.log(err);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Donaciones</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Tipo de donación"
        value={tipo}
        onChangeText={setTipo}
      />
      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        keyboardType="numeric"
        value={cantidad}
        onChangeText={setCantidad}
      />
      <Button title="Insertar" onPress={handleInsertarDonacion} />
      <View style={styles.listContainer}>
        {donaciones.map(item => (
          <Text key={item.id}>{`ID: ${item.id}, Tipo: ${item.tipo}, Cantidad: ${item.cantidad}`}</Text>
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
