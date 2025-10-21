import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { init, subscribeToTable } from '@/db/database';

type FamilyRecord = {
  id: number;
  apellido: string;
  miembros: number;
};

type FamilyManagerProps = {
  fetchAll: () => Promise<FamilyRecord[]>;
  onCreate: (apellido: string, miembros: number) => Promise<unknown>;
  onUpdate: (id: number, apellido: string, miembros: number) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
};

export function FamilyManager({ fetchAll, onCreate, onUpdate, onDelete }: FamilyManagerProps) {
  const [records, setRecords] = useState<FamilyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [apellido, setApellido] = useState('');
  const [miembros, setMiembros] = useState('');
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
    const data = await fetchAll();
    setRecords(data);
  }, [fetchAll]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await init();
        if (!isMounted) {
          return;
        }
        await refresh();
      } catch (error) {
        console.error(error);
        if (isMounted) {
          Alert.alert('Error', 'No se pudo cargar la lista, intenta nuevamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeToTable('familias', () => {
      refresh().catch(err => {
        console.error('No se pudo actualizar la lista de familias en tiempo real', err);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const resetForm = () => {
    setApellido('');
    setMiembros('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const trimmedApellido = apellido.trim();
    const miembrosNumber = Number(miembros);

    if (!trimmedApellido || Number.isNaN(miembrosNumber) || miembrosNumber <= 0) {
      Alert.alert('Datos incompletos', 'Ingresa un apellido y una cantidad de miembros mayor a cero.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, trimmedApellido, miembrosNumber);
        Alert.alert('Actualizado', 'La familia se actualizo correctamente.');
      } else {
        await onCreate(trimmedApellido, miembrosNumber);
        Alert.alert('Guardado', 'La familia se agrego correctamente.');
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

  const startEditing = (item: FamilyRecord) => {
    setApellido(item.apellido);
    setMiembros(String(item.miembros));
    setEditingId(item.id);
  };

  const confirmDelete = (item: FamilyRecord) => {
    Alert.alert('Eliminar familia', `Seguro que queres eliminar a la familia ${item.apellido}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete(item.id);
            Alert.alert('Eliminado', 'La familia fue eliminada.');
            await refresh();
            if (editingId === item.id) {
              resetForm();
            }
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar la familia.');
          }
        },
      },
    ]);
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return records;
    }
    const term = searchQuery.trim().toLowerCase();
    return records.filter(item => item.apellido.toLowerCase().includes(term));
  }, [records, searchQuery]);

  const renderItem = ({ item }: { item: FamilyRecord }) => (
    <View style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
      <View style={styles.listItemHeader}>
        <Ionicons name='home-outline' size={28} color={accentColor} style={styles.listItemIcon} />
        <View style={styles.listItemText}>
          <Text style={[styles.listItemName, isDark && styles.listItemNameDark]}>{item.apellido}</Text>
          <Text style={[styles.listItemSubtitle, isDark && styles.listItemSubtitleDark]}>
            {item.miembros} {item.miembros === 1 ? 'miembro' : 'miembros'}
          </Text>
          <Text style={[styles.listItemId, isDark && styles.listItemIdDark]}>ID #{item.id}</Text>
        </View>
      </View>
      <View style={styles.listItemActions}>
        <AppButton label='Editar' onPress={() => startEditing(item)} style={styles.inlineButton} />
        <AppButton
          label='Eliminar'
          onPress={() => confirmDelete(item)}
          variant='secondary'
          style={styles.inlineButton}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: topSpacing }]}>
      <View style={styles.headerRow}>
        <Ionicons name='home-outline' size={32} color={accentColor} style={styles.headerIcon} />
        <ThemedText type='title' style={styles.title}>
          Familias
        </ThemedText>
      </View>
      <ThemedText style={styles.description}>
        Registra cada familia con su apellido y la cantidad total de integrantes.
      </ThemedText>

      <SectionCard lightColor='#f8fafc' darkColor='#1f2937'>
        <View style={styles.sectionHeader}>
          <Ionicons name={editingId !== null ? 'create-outline' : 'add-circle-outline'} size={22} color={accentColor} />
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            {editingId !== null ? 'Editar familia' : 'Agregar familia'}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder='Apellido de la familia'
          placeholderTextColor={placeholderColor}
          autoCapitalize='words'
          value={apellido}
          onChangeText={setApellido}
          accessibilityLabel='Apellido'
        />
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder='Cantidad de miembros'
          placeholderTextColor={placeholderColor}
          keyboardType='numeric'
          value={miembros}
          onChangeText={setMiembros}
          accessibilityLabel='Cantidad de miembros'
        />
        <AppButton
          label={editingId !== null ? 'Guardar cambios' : 'Registrar familia'}
          onPress={handleSubmit}
          disabled={submitting}
        />
        {editingId !== null && (
          <AppButton label='Cancelar edicion' variant='secondary' onPress={resetForm} disabled={submitting} />
        )}
      </SectionCard>

      <SectionCard lightColor='#f8fafc' darkColor='#1f2937' style={styles.listCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name='list-outline' size={22} color={accentColor} />
          <ThemedText type='subtitle' style={styles.sectionTitle}>
            Familias registradas
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, styles.searchInput, isDark ? styles.inputDark : styles.inputLight]}
          placeholder='Buscar familias'
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel='Buscar familias'
        />
        {loading ? (
          <ActivityIndicator size='large' color='#2563eb' style={styles.loader} />
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Todavia no hay familias registradas.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
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
    gap: 12,
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
  listCard: {
    flex: 1,
  },
  listContent: {
    gap: 12,
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
  listItemText: {
    flex: 1,
  },
  listItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  listItemNameDark: {
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
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  listItemIdDark: {
    color: '#94a3b8',
  },
  listItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
