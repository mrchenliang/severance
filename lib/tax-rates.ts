import type { Province } from "./types"

// GST/HST rates by province (as of 2024)
export const TAX_RATES: Record<Province, number> = {
  ON: 0.13, // HST 13%
  BC: 0.12, // GST + PST = 12%
  AB: 0.05, // GST 5%
  SK: 0.11, // GST + PST = 11%
  MB: 0.12, // GST + PST = 12%
  NS: 0.15, // HST 15%
  NB: 0.15, // HST 15%
  NL: 0.15, // HST 15%
  PE: 0.15, // HST 15%
  NT: 0.05, // GST 5%
  YT: 0.05, // GST 5%
  NU: 0.05, // GST 5%
  QC: 0.14975, // GST + QST = 14.975%
  Federal: 0.05, // GST 5%
}

export function getTaxRate(province: Province): number {
  return TAX_RATES[province] || 0.05
}

export function calculateTax(amount: number, province: Province): number {
  return amount * getTaxRate(province)
}

export function calculateTotalWithTax(amount: number, province: Province): number {
  return amount + calculateTax(amount, province)
}
