import { Pressable, StyleSheet, Text, type ViewStyle, type StyleProp } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_STYLES: Record<Variant, string> = {
  primary: '#2563eb',
  secondary: '#475569',
  danger: '#dc2626',
};

export function AppButton({ label, onPress, variant = 'primary', disabled, style }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: disabled ? '#9ca3af' : VARIANT_STYLES[variant] },
        pressed && !disabled ? styles.pressed : undefined,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.85,
  },
});
