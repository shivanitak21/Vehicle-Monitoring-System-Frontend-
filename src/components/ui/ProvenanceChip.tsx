import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';
import { provenanceLabelFor, type Provenance } from '@/lib/provenance';

const tone: Record<Provenance, string> = {
  real: colors.green,
  demo: colors.lime,
  stale: colors.amber,
  offline: colors.coral,
  unknown: colors.textMuted,
};

export function ProvenanceChip({ provenance }: { provenance: Provenance }) {
  const color = tone[provenance];
  return (
    <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
      <AppText variant="caption" style={{ color }}>
        {provenanceLabelFor(provenance)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
