import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  Donacion,
  actualizarDonacion,
  eliminarDonacion,
  init,
  insertarDonacion,
  obtenerDonaciones,
  subscribeToTable,
} from '@/db/database';

const PAGE_SIZE = 5;

export default function DonacionesScreen() {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [tipo, setTipo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const placeholderColor = isDark ? '#9ca3af' : '#64748b';
  const accentColor = isDark ? '#60a5fa' : '#2563eb';
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 16) + 68;

  const refresh = useCallback(async () => {
    const data = await obtenerDonaciones();
    setDonaciones(data);
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
          Alert.alert('Error', 'No se pudieron cargar las donaciones.');
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
    const unsubscribe = subscribeToTable('donaciones', () => {
      refresh();
    });
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, donaciones.length]);

  const resetForm = () => {
    setTipo('');
    setCantidad('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const trimmedTipo = tipo.trim();
    const cantidadNumber = parseInt(cantidad, 10);

    if (!trimmedTipo) {
      Alert.alert('Dato faltante', 'Ingresa el tipo de donacion.');
      return;
    }

    if (Number.isNaN(cantidadNumber) || cantidadNumber <= 0) {
      Alert.alert('Dato invalido', 'La cantidad debe ser mayor a cero.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await actualizarDonacion(editingId, trimmedTipo, cantidadNumber);
        Alert.alert('Actualizado', 'Se guardaron los cambios.');
      } else {
        await insertarDonacion(trimmedTipo, cantidadNumber);
        Alert.alert('Guardado', 'Donacion registrada correctamente.');
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

  const startEditing = (donacion: Donacion) => {
    setTipo(donacion.tipo);
    setCantidad(String(donacion.cantidad));
    setEditingId(donacion.id);
  };

  const confirmDelete = (donacion: Donacion) => {
    Alert.alert('Eliminar donacion', `Seguro que queres eliminar "${donacion.tipo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarDonacion(donacion.id);
            Alert.alert('Eliminado', 'La donacion fue eliminada.');
            await refresh();
            if (editingId === donacion.id) {
              resetForm();
            }
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar la donacion.');
          }
        },
      },
    ]);
  };

  const sortedDonaciones = useMemo(
    () => [...donaciones].sort((a, b) => b.id - a.id),
    [donaciones]
  );

  const filteredDonaciones = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return sortedDonaciones;
    }

    return sortedDonaciones.filter(item => {
      return item.tipo.toLowerCase().includes(term) || String(item.cantidad).includes(term);
    });
  }, [sortedDonaciones, searchQuery]);

  const visibleDonaciones = useMemo(
    () => filteredDonaciones.slice(0, Math.max(PAGE_SIZE, visibleCount)),
    [filteredDonaciones, visibleCount]
  );

  const hasMore = visibleCount < filteredDonaciones.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredDonaciones.length));
  };

  const totales = useMemo(() => {
    const totalCantidad = donaciones.reduce((acc, curr) => acc + curr.cantidad, 0);
    const tiposDiferentes = new Set(donaciones.map(item => item.tipo.trim().toLowerCase())).size;
    return { totalCantidad, tiposDiferentes };
  }, [donaciones]);

  return (
    <ThemedView style={[styles.container, { paddingTop: topSpacing }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Ionicons name="gift-outline" size={32} color={accentColor} style={styles.headerIcon} />
          <ThemedText type="title" style={styles.title}>
            Donaciones
          </ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Registra cada aporte que recibis y mantene el detalle al dia para tu equipo.
        </ThemedText>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name={editingId !== null ? 'create-outline' : 'add-circle-outline'} size={22} color={accentColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {editingId !== null ? 'Editar donacion' : 'Nueva donacion'}
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Tipo (alimentos, ropa, dinero, etc.)"
            placeholderTextColor={placeholderColor}
            value={tipo}
            onChangeText={setTipo}
            autoCapitalize="sentences"
            accessibilityLabel="Tipo de donacion"
          />
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Cantidad"
            placeholderTextColor={placeholderColor}
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
            accessibilityLabel="Cantidad"
          />
          <AppButton
            label={editingId !== null ? 'Guardar cambios' : 'Agregar donacion'}
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
            <View style={[styles.summaryCard, isDark ? styles.summaryCardDark : styles.summaryCardLight]}>
              <Ionicons name="cube-outline" size={24} color={accentColor} style={styles.summaryIcon} />
              <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{totales.totalCantidad}</Text>
              <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Total de unidades</Text>
            </View>
            <View style={[styles.summaryCard, isDark ? styles.summaryCardDark : styles.summaryCardLight]}>
              <Ionicons name="list-circle-outline" size={24} color={accentColor} style={styles.summaryIcon} />
              <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{totales.tiposDiferentes}</Text>
              <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Tipos distintos</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={22} color={accentColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Historial
            </ThemedText>
          </View>
          <TextInput
            style={[styles.input, styles.searchInput, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Buscar por tipo o cantidad"
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Buscar donaciones"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : visibleDonaciones.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {donaciones.length === 0 ? 'Todavia no cargaste ninguna donacion.' : 'No encontramos coincidencias.'}
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {visibleDonaciones.map(item => (
                <View key={item.id} style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                  <View style={styles.listItemHeader}>
                    <Ionicons name="gift-outline" size={28} color={accentColor} style={styles.listItemIcon} />
                    <View>
                      <Text style={[styles.listItemTitle, isDark && styles.listItemTitleDark]}>{item.tipo}</Text>
                      <Text style={[styles.listItemSubtitle, isDark && styles.listItemSubtitleDark]}>
                        Cantidad: {item.cantidad}
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
              ))}
            </View>
          )}

          {hasMore && !loading && (
            <AppButton
              label="Cargar más historial"
              variant="secondary"
              onPress={handleLoadMore}
              style={styles.loadMoreButton}
            />
          )}
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollContent: {
    rowGap: 16,
    paddingBottom: 48,
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
  searchInput: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
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
    fontSize: 26,
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
  historyList: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 4,
  },
  loader: {
    marginTop: 16,
  },
  listItem: {
    borderRadius: 16,
    padding: 16,
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
    fontSize: 18,
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
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 16,
    width: '100%',
  },
});
