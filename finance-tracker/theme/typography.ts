import { TextStyle } from 'react-native';

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
} as const;

export const typography = {
  // Headings / amounts — Instrument Serif
  displayLarge: {
    fontFamily: fonts.serif,
    fontSize: 48,
    lineHeight: 56,
  } satisfies TextStyle,
  displayMedium: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 44,
  } satisfies TextStyle,
  heading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 32,
  } satisfies TextStyle,
  headingItalic: {
    fontFamily: fonts.serifItalic,
    fontSize: 24,
    lineHeight: 32,
  } satisfies TextStyle,

  // Body / UI — Inter
  bodyLarge: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  labelSemibold: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  } satisfies TextStyle,

  // Amounts — always tabular numerals
  amount: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 44,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  amountSmall: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;
