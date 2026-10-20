import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';
import type { ConnectionState, Severity } from '@/types/models';

const severityColor: Record<Severity, string> = {
  info: colors.teal,
  watch: colors.amber,
  critical: colors.coral,
};

export function StatusPill({ label, tone = 'info' }: { label: string; tone?: Severity | 'lime' }) {
  const color = tone === 'lime' ? colors.lime : severityColor[tone];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const connectionCopy: Record<ConnectionState, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  live: 'Live link',
  demo: 'Demo signal',
  offline: 'Link offline',
};

export function ConnectionPill({ state }: { state: ConnectionState }) {
  const tone = state === 'live' ? 'info' : state === 'demo' ? 'lime' : state === 'offline' ? 'critical' : 'watch';
  return <StatusPill label={connectionCopy[state]} tone={tone} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(7, 11, 18, 0.72)',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
