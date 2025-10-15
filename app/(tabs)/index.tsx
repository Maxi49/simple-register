import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { SectionCard } from '@/components/ui/section-card';
import {
  init,
  obtenerAlumnos,
  obtenerDonaciones,
  obtenerFamilias,
  obtenerJovenes,
  obtenerRopa,
  subscribeToTables,
} from '@/db/database';

type DashboardStats = {
  jovenes: number;
  alumnos: number;
  familias: number;
  totalDonaciones: number;
  totalRopa: number;
};

const INITIAL_STATS: DashboardStats = {
  jovenes: 0,
  alumnos: 0,
  familias: 0,
  totalDonaciones: 0,
  totalRopa: 0,
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentColor = isDark ? '#60a5fa' : '#2563eb';
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 16) + 68;

  const loadStats = useCallback(async () => {
    const [jovenes, alumnos, familias, donaciones, ropa] = await Promise.all([
      obtenerJovenes(),
      obtenerAlumnos(),
      obtenerFamilias(),
      obtenerDonaciones(),
      obtenerRopa(),
    ]);

    setStats({
      jovenes: jovenes.length,
      alumnos: alumnos.length,
      familias: familias.length,
      totalDonaciones: donaciones.reduce((total, item) => total + item.cantidad, 0),
      totalRopa: ropa.reduce((total, item) => total + item.cantidad, 0),
    });
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await init();
        if (!active) {
          return;
        }
        await loadStats();
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loadStats]);

  useEffect(() => {
    const unsubscribe = subscribeToTables(['jovenes', 'alumnos', 'familias', 'donaciones', 'ropa'], () => {
      loadStats().catch(error => {
        console.error('No se pudo actualizar el tablero en tiempo real', error);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [loadStats]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadStats();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topSpacing }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Ionicons name="speedometer-outline" size={32} color={accentColor} style={styles.headerIcon} />
          <ThemedText type="title" style={styles.title}>
            Panel Principal
          </ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Aca vas a ver un resumen rapido de lo que esta cargado y podes saltar directo a cada seccion para actualizar
          los datos.
        </ThemedText>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={22} color={accentColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Resumen general
            </ThemedText>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={[styles.statTile, isDark && styles.statTileDark]}>
                <Ionicons name="people-outline" size={24} color={accentColor} style={styles.statIcon} />
                <ThemedText type="subtitle">{stats.jovenes}</ThemedText>
                <ThemedText style={styles.statLabel}>Jovenes registrados</ThemedText>
              </View>
              <View style={[styles.statTile, isDark && styles.statTileDark]}>
                <Ionicons name="school-outline" size={24} color={accentColor} style={styles.statIcon} />
                <ThemedText type="subtitle">{stats.alumnos}</ThemedText>
                <ThemedText style={styles.statLabel}>Alumnos registrados</ThemedText>
              </View>
              <View style={[styles.statTile, isDark && styles.statTileDark]}>
                <Ionicons name="home-outline" size={24} color={accentColor} style={styles.statIcon} />
                <ThemedText type="subtitle">{stats.familias}</ThemedText>
                <ThemedText style={styles.statLabel}>Familias registradas</ThemedText>
              </View>
              <View style={[styles.statTile, isDark && styles.statTileDark]}>
                <Ionicons name="heart-outline" size={24} color={accentColor} style={styles.statIcon} />
                <ThemedText type="subtitle">{stats.totalDonaciones}</ThemedText>
                <ThemedText style={styles.statLabel}>Unidades donadas</ThemedText>
              </View>
              <View style={[styles.statTile, isDark && styles.statTileDark]}>
                <Ionicons name="shirt-outline" size={24} color={accentColor} style={styles.statIcon} />
                <ThemedText type="subtitle">{stats.totalRopa}</ThemedText>
                <ThemedText style={styles.statLabel}>Prendas en stock</ThemedText>
              </View>
            </View>
          )}
          <AppButton label="Actualizar datos" onPress={handleRefresh} style={styles.refreshButton} />
        </SectionCard>

        <SectionCard lightColor="#f8fafc" darkColor="#1f2937">
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={22} color={accentColor} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Accesos rapidos
            </ThemedText>
          </View>
          <AppButton label="Gestionar jovenes" onPress={() => router.push('/(tabs)/jovenes')} />
          <AppButton label="Gestionar alumnos" onPress={() => router.push('/(tabs)/alumnos')} />
          <AppButton label="Gestionar familias" onPress={() => router.push('/(tabs)/familias')} />
          <AppButton label="Gestionar donaciones" onPress={() => router.push('/(tabs)/donaciones')} />
          <AppButton label="Gestionar ropa" onPress={() => router.push('/(tabs)/ropa')} />
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
  loader: {
    marginVertical: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statTile: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  statIcon: {
    marginBottom: 8,
  },
  statTileDark: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 14,
  },
  refreshButton: {
    marginTop: 16,
  },
});
