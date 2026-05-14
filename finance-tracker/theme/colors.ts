export const colors = {
  bg: '#2A2B2A',
  bgElevated: '#353635',
  bgInput: '#3F4040',
  border: '#454645',
  accent: '#61988E',
  accentMuted: '#3F5F58',
  text: '#F5F5F0',
  textMuted: '#9B9B96',
  textDim: '#6B6B66',
  danger: '#C97064',
  warning: '#D4A574',
} as const;

export type ColorKey = keyof typeof colors;
