import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Variant = 'display' | 'title' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'dim' | 'lime' | 'danger' | 'teal' | 'amber';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, lineHeight: 18, letterSpacing: 0.4 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
};

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  dim: colors.textDim,
  lime: colors.lime,
  danger: colors.coral,
  teal: colors.teal,
  amber: colors.amber,
};

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return <Text {...props} style={[variantStyle[variant], { color: toneColor[tone] }, style]} />;
}
