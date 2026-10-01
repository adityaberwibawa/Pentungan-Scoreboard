/** PentungScore — tema terpusat. Satu-satunya sumber warna & gaya. */
import { StyleSheet } from 'react-native';

export const Colors = {
  base: '#101415',
  card: '#1A1F22',
  raised: '#232A2E',
  border: '#2C353A',
  ink: '#F2F4F3',
  muted: '#9AA5AD',
  accent: '#34D399',
  onAccent: '#052E22',
  gold: '#F5C842',
  danger: '#F87171',
  rank: '#6B7680',
  coal: '#101415',
} as const;

export const Soft = {
  accentSoft: 'rgba(52, 211, 153, 0.12)',
  goldSoft: 'rgba(245, 200, 66, 0.12)',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
} as const;

export const AvatarTint: Record<string, { bg: string; fg: string; border: string }> = {
  emerald: { bg: 'rgba(52, 211, 153, 0.14)', fg: Colors.accent, border: Colors.accent },
  gold: { bg: 'rgba(245, 200, 66, 0.14)', fg: Colors.gold, border: Colors.gold },
  crimson: { bg: 'rgba(248, 113, 113, 0.14)', fg: Colors.danger, border: Colors.danger },
  slate: { bg: Colors.raised, fg: Colors.muted, border: Colors.border },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;

/** Lebar konten maksimum (tablet) — konten rata tengah di atasnya. */
export const MAX_CONTENT_WIDTH = 720;
/** Target sentuh minimum (aksesibilitas). */
export const MIN_TOUCH = 44;

export const FontFamily = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  display: 'SpaceGrotesk_700Bold',
} as const;

/** Gaya bersama agar konsisten di semua layar. */
export const Common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.base },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  title: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 20 },
  subtitle: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13 },
  bodyText: { color: Colors.ink, fontFamily: FontFamily.body, fontSize: 15 },
  mutedText: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13 },
});
