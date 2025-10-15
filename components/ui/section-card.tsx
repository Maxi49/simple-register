import type { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';

type SectionCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  lightColor?: string;
  darkColor?: string;
}>;

export function SectionCard({
  children,
  style,
  lightColor = '#ffffff',
  darkColor = '#111827',
}: SectionCardProps) {
  return (
    <ThemedView lightColor={lightColor} darkColor={darkColor} style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
});
