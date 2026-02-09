import type { LawyerPricing, Province } from "./types"
import { calculateTotalWithTax, getTaxRate } from "./tax-rates"

export interface LawyerOption {
  type: "consultation" | "hourly" | "flat" | "contingency"
  name: string
  description: string
  baseCost: number
  tax: number
  totalCost: number
  estimatedRecovery?: number // Net amount after lawyer fees (for contingency)
  netBenefit?: number // Net benefit compared to not hiring lawyer
}

export interface LawyerCostAnalysis {
  options: LawyerOption[]
  recommended: LawyerOption
  potentialGap: number
  province: Province
}

/**
 * Estimate hours needed for severance negotiation based on complexity
 */
function estimateHours(gap: number, complexity: "simple" | "moderate" | "complex"): number {
  // Simple: straightforward case, minimal negotiation (5-8 hours)
  // Moderate: some back-and-forth, document review (8-12 hours)
  // Complex: significant negotiation, multiple rounds (12-20 hours)
  
  const baseHours = gap < 10000 ? 5 : gap < 30000 ? 8 : 12
  
  const multipliers = {
    simple: 1.0,
    moderate: 1.5,
    complex: 2.0,
  }
  
  return Math.round(baseHours * multipliers[complexity])
}

/**
 * Determine complexity based on gap amount
 */
function determineComplexity(gap: number): "simple" | "moderate" | "complex" {
  if (gap < 10000) return "simple"
  if (gap < 30000) return "moderate"
  return "complex"
}

export function analyzeLawyerCosts(
  lawyerPricing: LawyerPricing,
  province: Province,
  currentOffer: number | undefined,
  recommendedAmount: number,
  potentialGap: number,
  statutoryMinimum: number = 0,
  customHours?: number,
  customContingencyPercentage?: number,
  customFlatFee?: number,
  customTaxRate?: number
): LawyerCostAnalysis {
  const options: LawyerOption[] = []
  const taxRate = customTaxRate !== undefined ? customTaxRate : getTaxRate(province)
  
  // Analyze if there's potential value (gap from offer or upside from statutory)
  const hasValue = potentialGap > 0
  const isBasedOnOffer = currentOffer !== undefined && currentOffer > 0
  
  // Option 1: Consultation Only
  const consultationBase = lawyerPricing.consultationFee.average
  const consultationTax = Math.round(consultationBase * taxRate)
  const consultationTotal = Math.round(consultationBase + consultationTax)
  
  options.push({
    type: "consultation",
    name: "Initial Consultation Only",
    description: "Get legal advice and review your severance package",
    baseCost: consultationBase,
    tax: consultationTax,
    totalCost: consultationTotal,
    netBenefit: hasValue ? Math.round(potentialGap - consultationTotal) : Math.round(-consultationTotal),
  })
  
  // Option 2: Hourly Rate
  if (hasValue) {
    const complexity = determineComplexity(potentialGap)
    const estimatedHours = customHours !== undefined ? customHours : estimateHours(potentialGap, complexity)
    const hourlyBase = Math.round(lawyerPricing.hourlyRate.average * estimatedHours)
    const hourlyTax = Math.round(hourlyBase * taxRate)
    const hourlyTotal = Math.round(hourlyBase + hourlyTax)
    
    options.push({
      type: "hourly",
      name: `Hourly Rate (${estimatedHours} hours${customHours !== undefined ? " custom" : " estimated"})`,
      description: `Pay by the hour for negotiation services${customHours === undefined ? ` (${complexity} case)` : ""}`,
      baseCost: hourlyBase,
      tax: hourlyTax,
      totalCost: hourlyTotal,
      netBenefit: Math.round(potentialGap - hourlyTotal),
    })
  }
  
  // Option 3: Flat Fee
  if (lawyerPricing.flatFeeRange && hasValue) {
    const flatFeeBase = customFlatFee !== undefined ? customFlatFee : lawyerPricing.flatFeeRange.min
    const flatFeeTax = Math.round(flatFeeBase * taxRate)
    const flatFeeTotal = Math.round(flatFeeBase + flatFeeTax)
    
    options.push({
      type: "flat",
      name: `Flat Fee Package${customFlatFee !== undefined ? " (custom)" : ""}`,
      description: "Fixed fee for complete severance negotiation and review",
      baseCost: flatFeeBase,
      tax: flatFeeTax,
      totalCost: flatFeeTotal,
      netBenefit: Math.round(potentialGap - flatFeeTotal),
    })
  }
  
  // Option 4: Contingency Fee
  if (lawyerPricing.contingencyFee && hasValue) {
    const contingencyPercentage = customContingencyPercentage !== undefined 
      ? customContingencyPercentage / 100 
      : lawyerPricing.contingencyFee.percentage / 100
    const displayPercentage = customContingencyPercentage !== undefined 
      ? customContingencyPercentage 
      : lawyerPricing.contingencyFee.percentage
    const contingencyFee = Math.round(potentialGap * contingencyPercentage)
    const contingencyTax = Math.round(contingencyFee * taxRate)
    const contingencyTotal = Math.round(contingencyFee + contingencyTax)
    const estimatedRecovery = Math.round(potentialGap - contingencyTotal)
    
    options.push({
      type: "contingency",
      name: `Contingency Fee (${displayPercentage}%${customContingencyPercentage !== undefined ? " custom" : ""})`,
      description: "Pay only if lawyer successfully recovers additional severance",
      baseCost: contingencyFee,
      tax: contingencyTax,
      totalCost: contingencyTotal,
      estimatedRecovery,
      netBenefit: estimatedRecovery, // Net benefit is the recovery minus fees
    })
  }
  
  // Determine recommended option
  // Priority: 1) Highest net benefit, 2) Lowest risk (contingency preferred if similar benefit)
  // Exclude consultation from recommendations as it's not effective for outcomes
  let recommended = options[0]
  
  if (hasValue) {
    // Filter out consultation options and sort by net benefit (highest first), but prefer contingency if similar
    const actionableOptions = options.filter(opt => opt.type !== "consultation")
    
    if (actionableOptions.length > 0) {
      const sortedOptions = [...actionableOptions].sort((a, b) => {
        const netBenefitDiff = (b.netBenefit || 0) - (a.netBenefit || 0)
        
        // If net benefits are similar (within 10%), prefer contingency
        if (Math.abs(netBenefitDiff) < (potentialGap * 0.1)) {
          if (a.type === "contingency" && b.type !== "contingency") return -1
          if (b.type === "contingency" && a.type !== "contingency") return 1
        }
        
        return netBenefitDiff
      })
      
      recommended = sortedOptions[0]
    } else {
      // Fallback to consultation only if no other options available (shouldn't happen)
      recommended = options[0]
    }
  } else {
    // If no gap, consultation only makes sense
    recommended = options[0]
  }
  
  return {
    options,
    recommended,
    potentialGap,
    province,
  }
}

export interface LawyerCostAnalysisWithContext extends LawyerCostAnalysis {
  isBasedOnOffer: boolean
  potentialUpside: number
  recommendedAmount: number
  statutoryMinimum: number
}
