import type { LawyerOption } from "./lawyer-cost-analysis"

export interface DecisionGuidance {
  title: string
  description: string
  whenToChoose: string[]
  considerations: string[]
}

export function getDecisionGuidance(
  potentialGap: number,
  options: LawyerOption[]
): DecisionGuidance[] {
  const guidance: DecisionGuidance[] = []
  
  const consultationOption = options.find(o => o.type === "consultation")
  const hourlyOption = options.find(o => o.type === "hourly")
  const flatOption = options.find(o => o.type === "flat")
  const contingencyOption = options.find(o => o.type === "contingency")
  
  // Consultation Only Guidance
  if (consultationOption) {
    guidance.push({
      title: "Consultation Only",
      description: "Get legal advice without full representation",
      whenToChoose: [
        `Potential gap is small (under ${formatCurrency(5000)})`,
        "You want to understand your rights but may negotiate yourself",
        "You're unsure if pursuing legal action is worth it",
        "You need quick advice on a severance package"
      ],
      considerations: [
        `Cost: ${formatCurrency(consultationOption.totalCost)}`,
        "You handle negotiations yourself after getting advice",
        "Best for straightforward cases or when gap is minimal",
        "No ongoing legal representation"
      ]
    })
  }
  
  // Hourly Rate Guidance
  if (hourlyOption) {
    guidance.push({
      title: "Hourly Rate",
      description: "Pay by the hour for negotiation services",
      whenToChoose: [
        `Potential gap is moderate (${formatCurrency(5000)} - ${formatCurrency(25000)})`,
        "Case complexity is uncertain",
        "You want flexibility in legal representation",
        "Negotiation may be quick or may require multiple rounds"
      ],
      considerations: [
        `Estimated cost: ${formatCurrency(hourlyOption.totalCost)}`,
        "Costs can vary based on actual hours needed",
        "You pay regardless of outcome",
        "Good for cases where complexity is hard to predict"
      ]
    })
  }
  
  // Flat Fee Guidance
  if (flatOption) {
    guidance.push({
      title: "Flat Fee Package",
      description: "Fixed fee for complete negotiation",
      whenToChoose: [
        `Potential gap is moderate to large (${formatCurrency(10000)}+)`,
        "You want cost certainty upfront",
        "Case appears straightforward or moderately complex",
        "You prefer predictable expenses"
      ],
      considerations: [
        `Fixed cost: ${formatCurrency(flatOption.totalCost)}`,
        "No surprises - you know the total cost upfront",
        "You pay regardless of outcome",
        "Best when case complexity is predictable"
      ]
    })
  }
  
  // Contingency Fee Guidance
  if (contingencyOption) {
    guidance.push({
      title: "Contingency Fee",
      description: "Pay only if lawyer recovers additional severance",
      whenToChoose: [
        `Potential gap is significant (${formatCurrency(15000)}+)`,
        "You want to minimize financial risk",
        "You're confident there's a strong case",
        "You prefer to share risk with your lawyer"
      ],
      considerations: [
        `Fee: ${contingencyOption.baseCost ? `${formatCurrency(contingencyOption.baseCost)} (${Math.round((contingencyOption.baseCost / potentialGap) * 100)}% of recovery)` : "Percentage of recovery"}`,
        `Estimated net recovery: ${contingencyOption.estimatedRecovery ? formatCurrency(contingencyOption.estimatedRecovery) : "Varies"}`,
        "No upfront costs - only pay if successful",
        "Lawyer is incentivized to maximize your recovery",
        "Best for larger gaps where risk-sharing makes sense"
      ]
    })
  }
  
  return guidance
}

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount)
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}
