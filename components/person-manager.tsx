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
import { init, subscribeToTable, type TableName } from '@/db/database';

type PersonRecord = {
  id: number;
  nombre: string;
  apellido: string;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type PersonManagerProps<T extends PersonRecord> = {
  title: string;
  entityLabel: string;
  pluralLabel: string;
  iconName: IoniconName;
  subscriptionTable: TableName;
  fetchAll: () => Promise<T[]>;
  onCreate: (nombre: string, apellido: string) => Promise<unknown>;
  onUpdate: (id: number, nombre: string, apellido: string) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
};

export function PersonManager<T extends PersonRecord>({
  title,
  entityLabel,
  pluralLabel,
  iconName,
  subscriptionTable,
  fetchAll,
  onCreate,
  onUpdate,
  onDelete,
}: PersonManagerProps<T>) {
  const [records, setRecords] = useState<T[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
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
    const unsubscribe = subscribeToTable(subscriptionTable, () => {
      refresh();
    });
    return () => {
      unsubscribe();
    };
  }, [refresh, subscriptionTable]);

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const trimmedNombre = nombre.trim();
    const trimmedApellido = apellido.trim();

    if (!trimmedNombre || !trimmedApellido) {
      Alert.alert('Campos incompletos', 'Ingresa nombre y apellido para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, trimmedNombre, trimmedApellido);
        Alert.alert('Actualizado', `Se actualizo el ${entityLabel} correctamente.`);
      } else {
        await onCreate(trimmedNombre, trimmedApellido);
        Alert.alert('Guardado', `Nuevo ${entityLabel} agregado con exito.`);
      }
      await refresh();
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron guardar los datos, proba otra vez.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (record: PersonRecord) => {
    setNombre(record.nombre);
    setApellido(record.apellido);
    setEditingId(record.id);
  };

  const confirmDelete = (record: PersonRecord) => {
    Alert.alert(
      `Eliminar ${entityLabel}`,
      `Seguro que queres eliminar a ${record.nombre} ${record.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(record.id);
              Alert.alert('Eliminado', `${entityLabel} eliminado correctamente.`);
              await refresh();
              if (editingId === record.id) {
                resetForm();
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar, intenta nuevamente.');
            }
          },
        },
      ]
    );
  };

  const filteredRecords = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return records;
    }
    return records.filter(item => {
      const fullName = `${item.nombre} ${item.apellido}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [records, searchQuery]);

  return (
    <ThemedView style={[styles.container, { paddingTop: topSpacing }]}>
      <View style={styles.titleRow}>
        <Ionicons name={iconName} size={32} color={accentColor} style={styles.titleIcon} />
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <ThemedText style={styles.description}>
        Carga, busca y administra {pluralLabel} de forma sencilla. Todo queda guardado automaticamente.
      </ThemedText>

      <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
        <View style={styles.sectionHeader}>
          <Ionicons
            name={editingId !== null ? 'create-outline' : 'person-add-outline'}
            size={22}
            color={accentColor}
          />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {editingId !== null ? 'Editar datos' : 'Nuevo registro'}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder="Nombre"
          placeholderTextColor={placeholderColor}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          accessibilityLabel="Nombre"
        />
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          placeholder="Apellido"
          placeholderTextColor={placeholderColor}
          value={apellido}
          onChangeText={setApellido}
          autoCapitalize="words"
          accessibilityLabel="Apellido"
        />
        <AppButton
          label={editingId !== null ? 'Guardar cambios' : `Agregar ${entityLabel}`}
          onPress={handleSubmit}
          disabled={submitting}
        />
        {editingId !== null && (
          <AppButton label="Cancelar edicion" onPress={resetForm} variant="secondary" disabled={submitting} />
        )}
      </SectionCard>

      <SectionCard lightColor="#f8fafc" darkColor="#1f2937" style={styles.listCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={22} color={accentColor} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {pluralLabel}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, styles.searchInput, isDark ? styles.inputDark : styles.inputLight]}
          placeholder={`Buscar ${pluralLabel.toLowerCase()}`}
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          accessibilityLabel={`Buscar ${pluralLabel}`}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {records.length === 0
                    ? `Todavia no hay ${pluralLabel.toLowerCase()} cargados.`
                    : 'No encontramos coincidencias.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.listItem, isDark ? styles.listItemDark : styles.listItemLight]}>
                <View style={styles.listItemHeader}>
                  <Ionicons name={iconName} size={28} color={accentColor} style={styles.listItemIcon} />
                  <View style={styles.listItemText}>
                    <Text style={[styles.listItemName, isDark && styles.listItemNameDark]}>{item.nombre}</Text>
                    <Text style={[styles.listItemSurname, isDark && styles.listItemSurnameDark]}>{item.apellido}</Text>
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
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
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
  listItemSurname: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  listItemSurnameDark: {
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
