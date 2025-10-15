import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabBarIconProps = {
  iosActive: IconSymbolName;
  iosInactive: IconSymbolName;
  androidActive: IoniconName;
  androidInactive: IoniconName;
  color: string;
  focused: boolean;
  activeBackground: string;
};

const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

export function TabBarIcon({
  iosActive,
  iosInactive,
  androidActive,
  androidInactive,
  color,
  focused,
  activeBackground,
}: TabBarIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1.1 : 0.94)).current;
  const translateY = useRef(new Animated.Value(focused ? -6 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.12 : 0.96,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -6 : 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, translateY]);

  const size = focused ? 30 : 26;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale }, { translateY }],
          backgroundColor: focused ? activeBackground : 'transparent',
        },
      ]}>
      {Platform.OS === 'ios' ? (
        <IconSymbol name={focused ? iosActive : iosInactive} color={color} size={size} />
      ) : (
        <AnimatedIonicon name={focused ? androidActive : androidInactive} color={color} size={size} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
