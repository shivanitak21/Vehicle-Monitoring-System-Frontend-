import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
  name: 'map' | 'shield' | 'time' | 'people' | 'person';
  color: ColorValue;
  size?: number;
};

export function TabIcon({ name, color, size = 22 }: Props) {
  const stroke = typeof color === 'string' ? color : '#D6FF4A';
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const };
  if (name === 'map') {
    return (
      <Svg {...common}>
        <Path d="M9 4.5 4 6.5v13l5-2 6 2 5-2v-13l-5 2-6-2Z" stroke={stroke} strokeWidth={1.7} />
        <Path d="M9 4.5v13M15 6.5v13" stroke={stroke} strokeWidth={1.7} />
      </Svg>
    );
  }
  if (name === 'shield') {
    return (
      <Svg {...common}>
        <Path d="M12 3.5 19 6.2v5.4c0 4.2-2.8 6.8-7 8.4-4.2-1.6-7-4.2-7-8.4V6.2L12 3.5Z" stroke={stroke} strokeWidth={1.7} />
        <Path d="m8.8 12 2.1 2.1 4.3-4.4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    );
  }
  if (name === 'time') {
    return (
      <Svg {...common}>
        <Circle cx={12} cy={12} r={7.5} stroke={stroke} strokeWidth={1.7} />
        <Path d="M12 8.5V12l2.5 1.8" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    );
  }
  if (name === 'people') {
    return (
      <Svg {...common}>
        <Circle cx={9} cy={9} r={2.3} stroke={stroke} strokeWidth={1.7} />
        <Circle cx={16} cy={10} r={1.8} stroke={stroke} strokeWidth={1.7} />
        <Path d="M4.8 17.5c.7-2.2 2.4-3.3 4.2-3.3s3.5 1.1 4.2 3.3" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M13.2 14.4c1.3-.3 2.6.1 3.4 1.1.7.8 1.1 1.6 1.4 2.4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg {...common}>
      <Circle cx={12} cy={9} r={2.6} stroke={stroke} strokeWidth={1.7} />
      <Path d="M6.5 18c.8-2.6 2.7-3.8 5.5-3.8s4.7 1.2 5.5 3.8" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}
