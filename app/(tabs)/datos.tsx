import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  obtenerRegistroCambios,
  obtenerSnapshot,
  reemplazarDatos,
  subscribeToChangeLog,
} from '@/db/database';
import type { ChangeLogEntry, TableName } from '@/db/database';
import { buildExcelFromSnapshot, EXCEL_TEMPLATE_INFO, parseSnapshotFromExcel } from '@/lib/excel';
import { ensureWritableDirectory, readFileAsBase64, writeBase64File } from '@/utils/base64';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CHANGE_ACTION_ICONS: Record<ChangeLogEntry['accion'], IoniconName> = {
  INSERT: 'add-circle-outline',
  UPDATE: 'create-outline',
  DELETE: 'trash-outline',
};

const CHANGE_ACTION_LABELS: Record<ChangeLogEntry['accion'], string> = {
  INSERT: 'Alta',
  UPDATE: 'Actualización',
  DELETE: 'Baja',
};

const TABLE_LABELS: Record<TableName, string> = {
  ropa: 'Ropa',
  jovenes: 'Jóvenes',
  alumnos: 'Alumnos',
  familias: 'Familias',
  donaciones: 'Donaciones',
  actividades: 'Actividades',
  alumno_actividades: 'Actividad Alumnos',
  actividad_asistencias: 'Actividad Asistencias',
  actividad_asistencia_detalle: 'Actividad Asistencia Detalle',
};

const formatChangeDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatPayloadValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return 'N/A';
    }
  }
  return String(value);
};

const summarisePayload = (payload: ChangeLogEntry['payload']) => {
  if (!payload) {
    return 'Sin detalles adicionales.';
  }
  const entries = Object.entries(payload).filter(([key]) => key !== 'created_at' && key !== 'updated_at');
  if (entries.length === 0) {
    return 'Sin detalles adicionales.';
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${formatPayloadValue(value)}`)
    .join(' \u2014 ');
};

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const getPickedFileUri = (result: DocumentPicker.DocumentPickerResult) => {
  if ('canceled' in result && result.canceled) {
    return null;
  }
  if ('assets' in result && result.assets?.length) {
    return result.assets[0]?.uri ?? null;
  }
  // Compatibilidad con versiones antiguas (Expo SDK <= 49)
  if ('type' in result && result.type === 'success' && 'uri' in result) {
    return (result as unknown as { uri: string }).uri;
  }
  return null;
};

const persistBase64Excel = (filename: string, contents: string) => {
  const directory = ensureWritableDirectory();
  return writeBase64File(directory, filename, contents);
};

export default function DatosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentColor = isDark ? '#60a5fa' : '#2563eb';
  const [processing, setProcessing] = useState(false);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 16) + 68;

  useEffect(() => {
    let active = true;
    let fetching = false;

    const loadChangeLog = async () => {
      if (fetching) {
        return;
      }
      fetching = true;
      try {
        const entries = await obtenerRegistroCambios();
        if (active) {
          setChangeLog(entries);
        }
      } catch (error) {
        console.error('No se pudo cargar el historial de cambios', error);
      } finally {
        if (active) {
          setLoadingLog(false);
        }
        fetching = false;
      }
    };

    setLoadingLog(true);
    loadChangeLog();

    const unsubscribe = subscribeToChangeLog(() => {
      loadChangeLog();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleImport = async () => {
    try {
      setProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: EXCEL_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      const uri = getPickedFileUri(result);
      if (!uri) {
        return;
      }

      const base64 = await readFileAsBase64(uri);
      const snapshot = parseSnapshotFromExcel(base64);
      await reemplazarDatos(snapshot);
      Alert.alert('Importación completada', 'Los datos fueron reemplazados correctamente.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo importar el archivo seleccionado.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    try {
      setProcessing(true);
      const snapshot = await obtenerSnapshot();

      const base64 = buildExcelFromSnapshot(snapshot);
      const filename = `registros-${Date.now()}.xlsx`;
      const file = persistBase64Excel(filename, base64);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: EXCEL_MIME_TYPES[0],
          dialogTitle: 'Compartir registros',
        });
      } else {
        Alert.alert('Archivo generado', `El archivo se guardó en:\n${file.uri}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo exportar la base de datos.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topSpacing }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Ionicons name='cloud-upload-outline' size={32} color={accentColor} style={styles.headerIcon} />
          <ThemedText type='title' style={styles.title}>
            Importar y exportar
          </ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Aca podes cargar un Excel para reemplazar la informacion o generar un archivo con todos los datos actuales.
        </ThemedText>

        <SectionCard lightColor='#f8fafc' darkColor='#1f2937'>
          <View style={styles.sectionHeader}>
            <Ionicons name='download-outline' size={22} color={accentColor} />
            <ThemedText type='subtitle' style={styles.sectionTitle}>
              Importar desde Excel
            </ThemedText>
          </View>
          <ThemedText style={styles.bodyText}>
            El archivo debe incluir una hoja para cada tabla con los siguientes nombres y columnas:
          </ThemedText>
          {Object.entries(EXCEL_TEMPLATE_INFO.columns).map(([key, columns]) => (
            <View key={key} style={styles.listRow}>
              <Ionicons name='document-text-outline' size={18} color={accentColor} style={styles.listIcon} />
              <ThemedText style={styles.listText}>
                {EXCEL_TEMPLATE_INFO.sheetNames[key as keyof typeof EXCEL_TEMPLATE_INFO.sheetNames]}: {columns.join(', ')}
              </ThemedText>
            </View>
          ))}
          <AppButton label='Seleccionar archivo .xlsx' onPress={handleImport} disabled={processing} />
        </SectionCard>

        <SectionCard lightColor='#f8fafc' darkColor='#1f2937'>
          <View style={styles.sectionHeader}>
            <Ionicons name='cloud-upload-outline' size={22} color={accentColor} />
            <ThemedText type='subtitle' style={styles.sectionTitle}>
              Exportar datos
            </ThemedText>
          </View>
          <ThemedText style={styles.bodyText}>
            Se generara un Excel con todas las tablas actuales para que puedas compartirlo o editarlo en tu compu.
          </ThemedText>
          <AppButton label='Crear archivo de respaldo' onPress={handleExport} disabled={processing} />
        </SectionCard>

        <SectionCard lightColor='#f8fafc' darkColor='#1f2937'>
          <View style={styles.sectionHeader}>
            <Ionicons name='time-outline' size={22} color={accentColor} />
            <ThemedText type='subtitle' style={styles.sectionTitle}>
              Historial de cambios
            </ThemedText>
          </View>
          {loadingLog ? (
            <ActivityIndicator size='small' color={accentColor} style={styles.logLoader} />
          ) : changeLog.length === 0 ? (
            <ThemedText style={styles.bodyText}>
              Todavia no se registraron modificaciones en la base de datos.
            </ThemedText>
          ) : (
            <View style={styles.logList}>
              {changeLog.map(entry => (
                <View
                  key={entry.id}
                  style={[styles.logRow, isDark ? styles.logRowDark : styles.logRowLight]}>
                  <View style={styles.logRowHeader}>
                    <Ionicons
                      name={CHANGE_ACTION_ICONS[entry.accion]}
                      size={20}
                      color={accentColor}
                      style={styles.logIcon}
                    />
                    <View style={styles.logTitleWrapper}>
                      <ThemedText style={styles.logTitle}>
                        {CHANGE_ACTION_LABELS[entry.accion]} · {TABLE_LABELS[entry.tabla] ?? entry.tabla}
                      </ThemedText>
                      <ThemedText style={[styles.logSubtitle, isDark && styles.logSubtitleDark]}>
                        {formatChangeDate(entry.created_at)}
                      </ThemedText>
                    </View>
                  </View>
                  {entry.registro_id !== null && (
                    <ThemedText style={[styles.logMeta, isDark && styles.logMetaDark]}>
                      ID #{entry.registro_id}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.logDetails, isDark && styles.logDetailsDark]}>
                    {summarisePayload(entry.payload)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    rowGap: 16,
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
    columnGap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  bodyText: {
    fontSize: 15,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listIcon: {
    marginRight: 8,
  },
  listText: {
    fontSize: 14,
  },
  logLoader: {
    marginTop: 12,
  },
  logList: {
    gap: 12,
  },
  logRow: {
    borderRadius: 14,
    padding: 16,
  },
  logRowLight: {
    backgroundColor: '#e2e8f0',
  },
  logRowDark: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  logRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    marginRight: 12,
  },
  logTitleWrapper: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  logSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b',
  },
  logSubtitleDark: {
    color: '#cbd5f5',
  },
  logMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
  },
  logMetaDark: {
    color: '#94a3b8',
  },
  logDetails: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },
  logDetailsDark: {
    color: '#cbd5f5',
  },
});
