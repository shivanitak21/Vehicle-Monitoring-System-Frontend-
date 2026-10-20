import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

export function LoadingState({ label = 'Loading the latest safety picture' }: { label?: string }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.lime} />
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.box}>
      <AppText variant="title">{title}</AppText>
      <AppText tone="muted" style={styles.center}>
        {message}
      </AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.box}>
      <AppText variant="title">Couldn’t refresh</AppText>
      <AppText tone="muted" style={styles.center}>
        {message}
      </AppText>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  center: { textAlign: 'center' },
});
