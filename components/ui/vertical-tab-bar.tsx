import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const NAV_WIDTH = 260;
const NAV_OFFSET = 16;
const ANIMATION_CONFIG = {
  tension: 140,
  friction: 18,
  useNativeDriver: true,
} as const;

type VerticalTabBarProps = BottomTabBarProps & {
  isOpen: boolean;
  onRequestClose: () => void;
};

export function VerticalTabBar({ state, descriptors, navigation, isOpen, onRequestClose }: VerticalTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(-NAV_WIDTH - NAV_OFFSET)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? 0 : -NAV_WIDTH - NAV_OFFSET,
      ...ANIMATION_CONFIG,
    }).start();

    Animated.timing(backdropOpacity, {
      toValue: isOpen ? 0.4 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [backdropOpacity, isOpen, translateX]);

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
      </Animated.View>

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.wrapper,
          {
            top: insets.top + 72,
            bottom: Math.max(insets.bottom + 32, 80),
            transform: [{ translateX }],
          },
        ]}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: scheme === 'dark' ? 'rgba(15, 23, 42, 0.94)' : '#ffffff',
              borderColor: scheme === 'dark' ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.08)',
              shadowOpacity: scheme === 'dark' ? 0.4 : 0.16,
            },
          ]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = options.title ?? route.name;
              const isFocused = state.index === index;

              const handlePress = () => {
                const pressEvent = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !pressEvent.defaultPrevented) {
                  navigation.navigate(route.name);
                }
                if (!pressEvent.defaultPrevented) {
                  onRequestClose();
                }
              };

              const handleLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const activeColor = palette.tabIconSelected;
              const inactiveColor = palette.tabIconDefault;

              const icon =
                options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? activeColor : inactiveColor,
                  size: 30,
                }) ?? (
                  <Ionicons
                    name={isFocused ? 'ellipse' : 'ellipse-outline'}
                    size={26}
                    color={isFocused ? activeColor : inactiveColor}
                  />
                );

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={handlePress}
                  onLongPress={handleLongPress}
                  style={[
                    styles.item,
                    {
                      backgroundColor: isFocused
                        ? scheme === 'dark'
                          ? 'rgba(96, 165, 250, 0.16)'
                          : 'rgba(37, 99, 235, 0.14)'
                        : 'transparent',
                      borderColor: scheme === 'dark'
                        ? 'rgba(148, 163, 184, 0.24)'
                        : 'rgba(226, 232, 240, 0.7)',
                    },
                  ]}>
                  <View style={styles.iconWrapper}>{icon}</View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      {
                        color: isFocused ? activeColor : palette.text,
                      },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  wrapper: {
    position: 'absolute',
    left: NAV_OFFSET,
    width: NAV_WIDTH,
    zIndex: 20,
  },
  panel: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  scrollContent: {
    paddingVertical: 4,
    rowGap: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 18,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
