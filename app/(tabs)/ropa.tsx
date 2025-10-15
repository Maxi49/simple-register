import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import {
  Ropa,
  actualizarRopa,
  eliminarRopa,
  init,
  insertarRopa,
  obtenerRopa,
  subscribeToTable,
} from '@/db/database';

const GENERO_OPTIONS: Array<'hombre' | 'mujer'> = ['hombre', 'mujer'];

export default function RopaScreen() {
  const [items, setItems] = useState<Ropa[]>([]);
  const [cantidad, setCantidad] = useState('');
  const [genero, setGenero] = useState<'hombre' | 'mujer'>('hombre');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const placeholderColor = isDark ? '#9ca3af' : '#64748b';
  const accentColor = isDark ? '#60a5fa' : '#2563eb';
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 16) + 68;

  const refresh = useCallback(async () => {
    const data = await obtenerRopa();
    setItems(data);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await init();
        if (!active) {
          return;
        }
        await refresh();
      } catch (error) {
        console.error(error);
        if (active) {
          Alert.alert('Error', 'No se pudo cargar la ropa, intenta nuevamente.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeToTable('ropa', () => {
      refresh();
    });

    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const resetForm = () => {
    setCantidad('');
    setGenero('hombre');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const cantidadNumber = parseInt(cantidad, 10);
    if (Number.isNaN(cantidadNumber) || cantidadNumber <= 0) {
      Alert.alert('Dato invalido', 'Ingresa una cantidad mayor a cero.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await actualizarRopa(editingId, cantidadNumber, genero);
        Alert.alert('Actualizado', 'Se guardaron los cambios.');
      } else {
        await insertarRopa(cantidadNumber, genero);
        Alert.alert('Guardado', 'Registro agregado correctamente.');
      }
      await refresh();
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item: Ropa) => {
    setCantidad(String(item.cantidad));
    setGenero(item.genero);
    setEditingId(item.id);
  };

  const confirmDelete = (item: Ropa) => {
    Alert.alert('Eliminar registro', 'Seguro que queres eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarRopa(item.id);
            Alert.alert('Eliminado', 'El registro fue eliminado.');
            await refresh();
            if (editingId === item.id) {
              resetForm();
            }
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar el registro.');
          }
        },
      },
    ]);
  };

  const resumen = useMemo(() => {
    return GENERO_OPTIONS.map(option => {
      const total = items
        .filter(item => item.genero === option)
        .reduce((acc, curr) => acc + curr.cantidad, 0);
      return {
        genero: option,
        total,
        label: option === 'hombre' ? 'Para hombre' : 'Para mujer',
        icon: option === 'hombre' ? ('male-outline' as const) : ('female-outline' as const),
      };
    });
  }, [items]);

  return (
    <ThemedView style={[styles.container, { paddingTop: topSpacing }]}>
      <View style={styles.headerRow}>
        <Ionicons name="shirt-outline" size={32} color={accentColor} style={styles.headerIcon} />
        <ThemedText type="title" style={styles.title}>
          Ropa
        </ThemedText>
      </View>
      <ThemedText style={styles.description}>
        Lleva el control de las prendas disponibles y actualiza los datos cuando lo necesites.
      </ThemedText>

      <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
        <View style={styles.sectionHeader}>
          <Ionicons name={editingId !== null ? 'create-outline' : 'add-circle-outline'} size={22} color={accentColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {editingId !== null ? 'Editar registro' : 'Registrar ropa'}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder="Cantidad de prendas"
          placeholderTextColor={placeholderColor}
          keyboardType="numeric"
          value={cantidad}
          onChangeText={setCantidad}
          accessibilityLabel="Cantidad de prendas"
        />
        <View style={styles.segmented}>
          {GENERO_OPTIONS.map(option => {
            const active = genero === option;
            return (
              <Pressable
                key={option}
                onPress={() => setGenero(option)}
                style={[styles.segmentButton, active && styles.segmentButtonActive, active && { backgroundColor: accentColor }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {option === 'hombre' ? 'Hombre' : 'Mujer'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <AppButton
          label={editingId !== null ? 'Guardar cambios' : 'Agregar registro'}
          onPress={handleSubmit}
          disabled={submitting}
        />
        {editingId !== null && (
        <AppButton label="Cancelar edicion" onPress={resetForm} variant="secondary" disabled={submitting} />
        )}
      </SectionCard>

      <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
        <View style={styles.sectionHeader}>
          <Ionicons name="pie-chart-outline" size={22} color={accentColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Resumen
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          {resumen.map(item => (
            <View
              key={item.genero}
              style={[styles.summaryCard, isDark ? styles.summaryCardDark : styles.summaryCardLight]}
            >
              <Ionicons name={item.icon} size={24} color={accentColor} style={styles.summaryIcon} />
              <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{item.total}</Text>
              <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard lightColor="#f8fafc" darkColor="#1f2937" style={styles.listCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="archive-outline" size={22} color={accentColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Registros guardados
          </ThemedText>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Todavia no hay registros de ropa cargados.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                <View style={styles.listItemHeader}>
                  <Ionicons name={item.genero === 'hombre' ? 'male-outline' : 'female-outline'} size={28} color={accentColor} style={styles.listItemIcon} />
                  <View>
                    <Text style={[styles.listItemTitle, isDark && styles.listItemTitleDark]}>
                      {item.cantidad} prendas
                    </Text>
                    <Text style={[styles.listItemSubtitle, isDark && styles.listItemSubtitleDark]}>
                      {item.genero === 'hombre' ? 'Para hombre' : 'Para mujer'}
                    </Text>
                    <Text style={[styles.listItemId, isDark && styles.listItemIdDark]}>ID #{item.id}</Text>
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <AppButton
                    label="Editar"
                    variant="secondary"
                    onPress={() => startEditing(item)}
                    style={styles.inlineButton}
                  />
                  <AppButton
                    label="Eliminar"
                    variant="danger"
                    onPress={() => confirmDelete(item)}
                    style={styles.inlineButton}
                  />
                </View>
              </View>
            )}
          />
        )}
      </SectionCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    rowGap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    marginBottom: 0,
  },
  description: {
    marginBottom: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    columnGap: 8,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLight: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputDark: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#2563eb',
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  segmentLabelActive: {
    color: '#ffffff',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  summaryCardLight: {
    backgroundColor: '#e2e8f0',
  },
  summaryCardDark: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryValueDark: {
    color: '#f8fafc',
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  summaryLabelDark: {
    color: '#cbd5f5',
  },
  listCard: {
    flex: 1,
  },
  loader: {
    marginTop: 16,
  },
  listItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemLight: {
    backgroundColor: '#e2e8f0',
  },
  listItemDark: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  listItemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  listItemTitleDark: {
    color: '#f8fafc',
  },
  listItemSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#334155',
  },
  listItemSubtitleDark: {
    color: '#cbd5f5',
  },
  listItemId: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
  },
  listItemIdDark: {
    color: '#94a3b8',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  inlineButton: {
    flex: 1,
    marginVertical: 0,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
