import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/ui/tab-bar-icon';
import { VerticalTabBar } from '@/components/ui/vertical-tab-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [isNavOpen, setNavOpen] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const dragOverlayOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (isNavOpen) {
            return false;
          }
          if (gestureState.dx <= 16) {
            return false;
          }
          return Math.abs(gestureState.dy) < 48;
        },
        onPanResponderGrant: () => {
          dragX.setValue(0);
          dragOverlayOpacity.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          const clamped = Math.max(0, Math.min(gestureState.dx, 240));
          dragX.setValue(clamped);
          dragOverlayOpacity.setValue(Math.min(clamped / 220, 1));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 140) {
            setNavOpen(true);
          }
          Animated.timing(dragX, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
          Animated.timing(dragOverlayOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.timing(dragX, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(dragOverlayOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
          ]).start();
        },
      }),
    [dragOverlayOpacity, dragX, isNavOpen]
  );

  const toggleNav = () => setNavOpen(prev => !prev);
  const closeNav = () => setNavOpen(false);

  const toggleButtonStyle = useMemo(
    () => [
      styles.toggleButton,
      {
        top: insets.top + 22,
        left: 18,
        backgroundColor: colorScheme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
        shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.18,
      },
    ],
    [colorScheme, insets.top]
  );

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.dragOverlay,
          {
            opacity: dragOverlayOpacity,
          },
        ]}
      />

      <Tabs
        tabBar={props => <VerticalTabBar {...props} isOpen={isNavOpen} onRequestClose={closeNav} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="house.fill"
                iosInactive="house"
                androidActive="home"
                androidInactive="home-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="jovenes"
          options={{
            title: 'Jovenes',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="person.2.fill"
                iosInactive="person.2"
                androidActive="people"
                androidInactive="people-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="alumnos"
          options={{
            title: 'Alumnos',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="graduationcap.fill"
                iosInactive="graduationcap"
                androidActive="school"
                androidInactive="school-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="familias"
          options={{
            title: 'Familias',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="person.3.fill"
                iosInactive="person.3"
                androidActive="people-circle"
                androidInactive="people-circle-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="donaciones"
          options={{
            title: 'Donaciones',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="gift.fill"
                iosInactive="gift"
                androidActive="gift"
                androidInactive="gift-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="datos"
          options={{
            title: 'Datos',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="chart.bar.fill"
                iosInactive="chart.bar"
                androidActive="stats-chart"
                androidInactive="stats-chart-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ropa"
          options={{
            title: 'Ropa',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                iosActive="tshirt.fill"
                iosInactive="tshirt"
                androidActive="shirt"
                androidInactive="shirt-outline"
                color={color}
                focused={focused}
                activeBackground="transparent"
              />
            ),
          }}
        />
      </Tabs>

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre o cierra el menu de navegación lateral"
        onPress={toggleNav}
        style={toggleButtonStyle}>
        <Ionicons name={isNavOpen ? 'close' : 'menu'} size={22} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dragOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  toggleButton: {
    position: 'absolute',
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
});
