import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from '@/constants/theme';

export function VehicleMarker({ heading = 0 }: { heading?: number }) {
  const pulse = useSharedValue(0.45);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: pulse.value, transform: [{ scale: 0.8 + pulse.value * 0.35 }] }));

  return (
    <View style={[styles.wrap, { transform: [{ rotate: `${heading}deg` }] }]} collapsable={false}>
      <Animated.View style={[styles.halo, ring]} />
      <View style={styles.core}>
        <View style={styles.nose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(214, 255, 74, 0.22)',
  },
  core: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  nose: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.black,
    marginTop: -6,
  },
});
