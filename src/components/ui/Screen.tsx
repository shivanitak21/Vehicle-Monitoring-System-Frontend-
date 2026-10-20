import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  withHeader?: boolean;
};

export function Screen({ children, scroll = true, withHeader = false }: Props) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: withHeader ? 12 : insets.top + 12,
    paddingBottom: insets.bottom + 28,
    paddingHorizontal: 20,
  };
  if (!scroll) {
    return <View style={[styles.fill, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.fill}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, padding]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { gap: 16 },
});
