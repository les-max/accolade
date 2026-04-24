export const SHOW_TUITION_TIER_1 = 50   // $50, first 2 children per family
export const SHOW_TUITION_TIER_2 = 25   // $25, 3rd+ children

export const ACCOLADE_AD_PRICES = {
  full: 100,
  half: 60,
  quarter: 35,
  eighth: 20,
} as const
export type AdSize = keyof typeof ACCOLADE_AD_PRICES

export const AD_LABELS: Record<AdSize, string> = {
  full: 'Full Page Ad',
  half: 'Half Page Ad',
  quarter: 'Quarter Page Ad',
  eighth: 'Eighth Page Ad',
}

export const SHIRT_SIZES = ['YXS', 'YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL', 'AXXL'] as const
export type ShirtSize = typeof SHIRT_SIZES[number]

export function computeShowTuition(childCount: number): number {
  if (childCount <= 0) return 0
  const tier1 = Math.min(childCount, 2)
  const tier2 = Math.max(childCount - 2, 0)
  return tier1 * SHOW_TUITION_TIER_1 + tier2 * SHOW_TUITION_TIER_2
}
