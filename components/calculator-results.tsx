"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import type { SeveranceResult, LawyerPricing, Province } from "@/lib/types"
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Calculator, Info, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { analyzeLawyerCosts } from "@/lib/lawyer-cost-analysis"
import { getTaxRate } from "@/lib/tax-rates"
import { getDecisionGuidance } from "@/lib/decision-guide"

interface CalculatorResultsProps {
  results: SeveranceResult
  currentOffer?: number
  province: string
  lawyerPricing: LawyerPricing
  annualSalary?: number
  yearsOfService?: number
  monthsOfService?: number
  ageRange?: string
  jobPosition?: string
  companyName?: string
  companyRepresentative?: string
  customHours?: number
  customContingencyPercentage?: number
  customFlatFee?: number
  includeHST?: boolean
  onCustomHoursChange?: (hours: number | undefined) => void
  onCustomContingencyChange?: (percentage: number | undefined) => void
  onCustomFlatFeeChange?: (fee: number | undefined) => void
  onIncludeHSTChange?: (include: boolean) => void
  onCurrentOfferChange?: (offer: number | undefined) => void
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

function formatWeeks(weeks: number): string {
  const months = Math.floor(weeks / 4.33)
  const remainingWeeks = Math.round(weeks % 4.33)
  if (months === 0) {
    return `${weeks} week${weeks !== 1 ? "s" : ""}`
  }
  if (remainingWeeks === 0) {
    return `${months} month${months !== 1 ? "s" : ""}`
  }
  return `${months} month${months !== 1 ? "s" : ""}, ${remainingWeeks} week${remainingWeeks !== 1 ? "s" : ""}`
}

// Estimate income tax rate based on annual salary and province
// This is a simplified estimation using marginal tax rates
function estimateIncomeTaxRate(annualSalary: number, province: Province): number {
  // Federal tax brackets (2024)
  const federalBrackets = [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Infinity, rate: 0.33 },
  ]

  // Provincial tax rates (simplified - using approximate rates for 2024)
  const provincialRates: Record<Province, number> = {
    ON: 0.1316, // ~13.16% average
    BC: 0.1229, // ~12.29% average
    AB: 0.10,   // 10% flat
    SK: 0.125,  // ~12.5% average
    MB: 0.1275, // ~12.75% average
    NS: 0.1475, // ~14.75% average
    NB: 0.14,   // ~14% average
    NL: 0.145,  // ~14.5% average
    PE: 0.137,  // ~13.7% average
    NT: 0.117,  // ~11.7% average
    YT: 0.12,   // ~12% average
    NU: 0.11,   // ~11% average
    QC: 0.20,   // ~20% average (higher due to QST)
    Federal: 0.15,
  }

  // Find federal marginal rate
  let federalRate = 0.15
  for (const bracket of federalBrackets) {
    if (annualSalary >= bracket.min && annualSalary < bracket.max) {
      federalRate = bracket.rate
      break
    }
    if (annualSalary >= bracket.max) {
      federalRate = bracket.rate
    }
  }

  // Get provincial rate
  const provincialRate = provincialRates[province] || 0.15

  // Combined marginal tax rate (simplified - doesn't account for tax credits)
  return federalRate + provincialRate
}

export function CalculatorResults({
  results,
  currentOffer,
  province,
  lawyerPricing,
  annualSalary,
  yearsOfService = 0,
  monthsOfService = 0,
  ageRange,
  jobPosition,
  companyName = "",
  companyRepresentative = "",
  customHours,
  customContingencyPercentage,
  customFlatFee,
  includeHST = true,
  onCustomHoursChange,
  onCustomContingencyChange,
  onCustomFlatFeeChange,
  onIncludeHSTChange,
  onCurrentOfferChange,
}: CalculatorResultsProps) {
  const router = useRouter()
  const [expandedOption, setExpandedOption] = useState<string | null>(null)
  const [isDecisionGuideExpanded, setIsDecisionGuideExpanded] = useState(false)
  const [offerInputType, setOfferInputType] = useState<"dollars" | "weeks">("dollars")
  const [offerWeeks, setOfferWeeks] = useState<number>(() => {
    if (currentOffer && annualSalary && annualSalary > 0) {
      const weeklySalary = annualSalary / 52
      return Math.round(currentOffer / weeklySalary)
    }
    return 0
  })

  // Update offerWeeks when currentOffer or annualSalary changes
  useEffect(() => {
    if (currentOffer && annualSalary && annualSalary > 0) {
      const weeklySalary = annualSalary / 52
      const weeks = Math.round(currentOffer / weeklySalary)
      if (weeks > 0 && weeks <= 104) {
        setOfferWeeks(weeks)
      }
    } else {
      setOfferWeeks(0)
    }
  }, [currentOffer, annualSalary])

  const { statutoryMinimum, statutorySeverance, commonLawRange, recommendedRange } = results

  const totalStatutory = statutoryMinimum.amount + (statutorySeverance?.amount || 0)
  const gap = currentOffer
    ? recommendedRange.amount - currentOffer
    : null

  // Calculate potential upside: recommended range vs statutory minimum
  // This shows the value of pursuing common law entitlements
  const potentialUpside = recommendedRange.amount - totalStatutory

  // Use gap if available, otherwise use potential upside
  const potentialGap = gap && gap > 0 ? gap : (potentialUpside > 0 ? potentialUpside : 0)

  // Get tax rate - use 0 if HST is disabled
  const baseTaxRate = getTaxRate(province as Province)
  const taxRate = includeHST ? baseTaxRate : 0

  // Analyze lawyer costs based on recommended range with custom settings
  const analysis = analyzeLawyerCosts(
    lawyerPricing,
    province as Province,
    currentOffer,
    recommendedRange.amount,
    potentialGap,
    totalStatutory,
    customHours,
    customContingencyPercentage,
    customFlatFee,
    taxRate
  )

  // Get decision guidance
  const decisionGuidance = potentialGap > 0 ? getDecisionGuidance(potentialGap, analysis.options) : []

  // Navigate to demand letter page
  const handleGenerateDemandLetter = () => {
    const params = new URLSearchParams()
    params.set("province", province)
    params.set("years", String(yearsOfService || 0))
    params.set("months", String(monthsOfService ?? 0))
    if (ageRange) params.set("age", ageRange)
    if (jobPosition) params.set("position", jobPosition)
    if (annualSalary) params.set("salary", String(annualSalary))
    if (currentOffer) params.set("offer", String(currentOffer))
    if (companyName) params.set("companyName", companyName)
    if (companyRepresentative) params.set("companyRep", companyRepresentative)
    router.push(`/demand-letter?${params.toString()}`)
  }

  // Calculate net take-home for an option
  const calculateNetTakeHome = (option: typeof analysis.options[0]) => {
    const startingAmount = currentOffer || totalStatutory
    const recoveredAmount = recommendedRange.amount
    const lawyerFees = option.totalCost

    // Calculate income tax on severance payment
    let incomeTax = 0
    if (annualSalary && annualSalary > 0) {
      const incomeTaxRate = estimateIncomeTaxRate(annualSalary, province as Province)
      incomeTax = Math.round(recoveredAmount * incomeTaxRate)
    }

    // Net take-home = Severance - Income Tax - Lawyer Fees
    const netTakeHome = recoveredAmount - incomeTax - lawyerFees

    return {
      startingAmount,
      recoveredAmount,
      incomeTax,
      lawyerFees,
      netTakeHome,
      improvement: netTakeHome - startingAmount
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Severance Pay Estimate</CardTitle>
          <CardDescription>
            Results for {province}. These are estimates only and do not constitute legal advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statutory Minimum */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Statutory Minimum</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Minimum required by employment standards legislation
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatCurrency(statutoryMinimum.amount)}</span>
              <span className="text-sm text-muted-foreground">
                ({formatWeeks(statutoryMinimum.weeks)})
              </span>
            </div>
          </div>

          {/* Statutory Severance (if applicable) */}
          {statutorySeverance && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Statutory Severance Pay</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Additional severance required by Ontario ESA (employer payroll ≥ $2.5M)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatCurrency(statutorySeverance.amount)}</span>
                <span className="text-sm text-muted-foreground">
                  ({formatWeeks(statutorySeverance.weeks)})
                </span>
              </div>
            </div>
          )}

          {/* Common Law Range */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Common Law Reasonable Notice Range</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Typical range based on age, position, and years of service
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Minimum:</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{formatCurrency(commonLawRange.minAmount)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatWeeks(commonLawRange.minWeeks)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Maximum:</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{formatCurrency(commonLawRange.maxAmount)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatWeeks(commonLawRange.maxWeeks)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Amount */}
          <div className="rounded-lg border-2 border-primary p-4 bg-primary/5">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recommended Severance Range
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Estimated reasonable notice based on your circumstances
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(recommendedRange.amount)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({formatWeeks(recommendedRange.weeks)})
              </span>
            </div>
          </div>

          {/* Current Offer Comparison */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {currentOffer !== undefined && gap && gap > 0 ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : currentOffer !== undefined ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : null}
              {currentOffer !== undefined ? "Comparison with Current Offer" : "Enter Your Current Offer"}
            </h3>
            
            {onCurrentOfferChange && annualSalary && (
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <RadioGroup
                      value={offerInputType}
                      onValueChange={(value) => {
                        setOfferInputType(value as "dollars" | "weeks")
                        // Convert between weeks and dollars when switching
                        if (value === "weeks" && currentOffer) {
                          const weeklySalary = annualSalary / 52
                          const weeks = Math.round(currentOffer / weeklySalary)
                          setOfferWeeks(weeks)
                        } else if (value === "dollars" && offerWeeks > 0) {
                          const weeklySalary = annualSalary / 52
                          const newOffer = Math.round(offerWeeks * weeklySalary)
                          onCurrentOfferChange(newOffer)
                        }
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dollars" id="offer-dollars-results" />
                        <Label htmlFor="offer-dollars-results" className="cursor-pointer text-sm">
                          Dollar Amount
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weeks" id="offer-weeks-results" />
                        <Label htmlFor="offer-weeks-results" className="cursor-pointer text-sm">
                          Package in Weeks
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {offerInputType === "dollars" ? (
                  <div className="space-y-2">
                    <Label htmlFor="offer-results">Amount (CAD)</Label>
                    <Input
                      id="offer-results"
                      type="number"
                      min="0"
                      step="1000"
                      value={currentOffer || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value)
                        onCurrentOfferChange(value)
                        if (value && annualSalary) {
                          const weeklySalary = annualSalary / 52
                          setOfferWeeks(Math.round(value / weeklySalary))
                        }
                      }}
                      placeholder="e.g., 15000"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="offer-weeks-slider-results">Weeks</Label>
                        <span className="text-lg font-semibold">
                          {offerWeeks} {offerWeeks === 1 ? "week" : "weeks"}
                          {annualSalary && offerWeeks > 0 && (
                            <span className="text-sm text-muted-foreground ml-2 font-normal">
                              ({formatCurrency((annualSalary / 52) * offerWeeks)})
                            </span>
                          )}
                        </span>
                      </div>
                      <Slider
                        id="offer-weeks-slider-results"
                        min={0}
                        max={104}
                        step={1}
                        value={[offerWeeks]}
                        onValueChange={(value) => {
                          const weeks = value[0]
                          setOfferWeeks(weeks)
                          if (annualSalary && weeks > 0) {
                            const weeklySalary = annualSalary / 52
                            onCurrentOfferChange(Math.round(weeks * weeklySalary))
                          } else {
                            onCurrentOfferChange(undefined)
                          }
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>0</span>
                        <span>26</span>
                        <span>52</span>
                        <span>78</span>
                        <span>104</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offer-weeks-input-results">Or enter manually</Label>
                      <Input
                        id="offer-weeks-input-results"
                        type="number"
                        min="0"
                        max="104"
                        step="1"
                        value={offerWeeks || ""}
                        onChange={(e) => {
                          const weeks = parseInt(e.target.value) || 0
                          setOfferWeeks(weeks)
                          if (annualSalary && weeks > 0) {
                            const weeklySalary = annualSalary / 52
                            onCurrentOfferChange(Math.round(weeks * weeklySalary))
                          } else {
                            onCurrentOfferChange(undefined)
                          }
                        }}
                        placeholder="Enter weeks"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentOffer !== undefined && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Your Offer:</span>
                  <span className="font-semibold">{formatCurrency(currentOffer)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recommended:</span>
                  <span className="font-semibold">{formatCurrency(recommendedRange.amount)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold">
                    {gap && gap > 0 ? "Potential Gap:" : "Surplus:"}
                  </span>
                  <span
                    className={`font-bold text-lg ${gap && gap > 0 ? "text-destructive" : "text-green-600"
                      }`}
                  >
                    {formatCurrency(Math.abs(gap || 0))}
                  </span>
                </div>
                {gap && gap > 0 && (
                  <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-destructive mb-1">
                        Your offer may be below common law entitlements
                      </p>
                      <p className="text-muted-foreground">
                        Consider consulting with an employment lawyer to review your situation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lawyer Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Legal Consultation Costs ({province})
          </CardTitle>
          <CardDescription>
            Estimated costs for employment lawyer consultation and representation (before tax)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2 text-sm">Initial Consultation</h4>
              <p className="text-2xl font-bold">
                {formatCurrency(lawyerPricing.consultationFee.average)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {formatCurrency(lawyerPricing.consultationFee.min)} -{" "}
                {formatCurrency(lawyerPricing.consultationFee.max)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                + {Math.round(taxRate * 100)}% tax = {formatCurrency(lawyerPricing.consultationFee.average * (1 + taxRate))}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2 text-sm">Hourly Rate</h4>
              <p className="text-2xl font-bold">
                {formatCurrency(lawyerPricing.hourlyRate.average)}/hr
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {formatCurrency(lawyerPricing.hourlyRate.min)} -{" "}
                {formatCurrency(lawyerPricing.hourlyRate.max)}/hr
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                + {Math.round(taxRate * 100)}% tax = {formatCurrency(lawyerPricing.hourlyRate.average * (1 + taxRate))}/hr
              </p>
            </div>
          </div>

          {lawyerPricing.flatFeeRange && (
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2 text-sm">Flat Fee (Package)</h4>
              <p className="text-lg font-semibold">
                {formatCurrency(lawyerPricing.flatFeeRange.min)} -{" "}
                {formatCurrency(lawyerPricing.flatFeeRange.max)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For complete severance negotiation and review
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                + {Math.round(taxRate * 100)}% tax = {formatCurrency(lawyerPricing.flatFeeRange.min * (1 + taxRate))} - {formatCurrency(lawyerPricing.flatFeeRange.max * (1 + taxRate))}
              </p>
            </div>
          )}

          {lawyerPricing.contingencyFee && (
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2 text-sm">Contingency Fee</h4>
              <p className="text-lg font-semibold">
                {lawyerPricing.contingencyFee.percentage}% of recovered amount
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only pay if lawyer successfully recovers additional severance
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tax applies to the fee portion only
              </p>
            </div>
          )}

          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">Important Disclaimer</p>
            <p className="text-muted-foreground">
              These results are estimates only and do not constitute legal advice. Actual
              severance entitlements depend on many factors including employment contracts,
              industry standards, and specific circumstances. It is strongly recommended that
              you consult with an employment lawyer for advice tailored to your situation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lawyer Settings */}
      {(onCustomHoursChange || onCustomContingencyChange || onCustomFlatFeeChange || onIncludeHSTChange) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Customize Lawyer Pricing
            </CardTitle>
            <CardDescription>
              Adjust lawyer hours, flat fee, contingency percentage, and tax settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Custom Hours */}
              {potentialGap > 0 && onCustomHoursChange && (
                <div className="space-y-2">
                  <Label htmlFor="custom-hours">Lawyer Hours (Hourly Rate)</Label>
                  <Input
                    id="custom-hours"
                    type="number"
                    min="1"
                    step="1"
                    value={customHours || ""}
                    onChange={(e) => onCustomHoursChange(e.target.value === "" ? undefined : parseInt(e.target.value) || undefined)}
                    placeholder="Auto-estimated"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use auto-estimate based on case complexity
                  </p>
                </div>
              )}

              {/* Custom Flat Fee */}
              {potentialGap > 0 && lawyerPricing.flatFeeRange && onCustomFlatFeeChange && (
                <div className="space-y-2">
                  <Label htmlFor="custom-flatfee">Flat Fee Package (CAD)</Label>
                  <Input
                    id="custom-flatfee"
                    type="number"
                    min="0"
                    step="100"
                    value={customFlatFee || ""}
                    onChange={(e) => onCustomFlatFeeChange(e.target.value === "" ? undefined : parseInt(e.target.value) || undefined)}
                    placeholder={`Default: ${formatCurrency(lawyerPricing.flatFeeRange.min)}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default flat fee
                  </p>
                </div>
              )}

              {/* Custom Contingency Percentage */}
              {potentialGap > 0 && onCustomContingencyChange && (
                <div className="space-y-2">
                  <Label htmlFor="custom-contingency">Contingency Percentage (%)</Label>
                  <Input
                    id="custom-contingency"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={customContingencyPercentage || ""}
                    onChange={(e) => onCustomContingencyChange(e.target.value === "" ? undefined : parseFloat(e.target.value) || undefined)}
                    placeholder="Default: 25%"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default percentage
                  </p>
                </div>
              )}

              {/* Include HST Toggle */}
              {onIncludeHSTChange && (
                <div className="space-y-2">
                  <Label>Include Tax</Label>
                  <RadioGroup
                    value={includeHST ? "yes" : "no"}
                    onValueChange={(value) => onIncludeHSTChange(value === "yes")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="hst-yes" />
                      <Label htmlFor="hst-yes" className="cursor-pointer text-sm">
                        Yes ({Math.round(getTaxRate(province as Province) * 100)}%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="hst-no" />
                      <Label htmlFor="hst-no" className="cursor-pointer text-sm">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lawyer Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Lawyer Cost Analysis ({province})
          </CardTitle>
          <CardDescription>
            {potentialGap > 0
              ? `Comparison of lawyer pricing options based on ${currentOffer ? `your current offer gap of ${formatCurrency(potentialGap)}` : `potential upside of ${formatCurrency(potentialGap)} from statutory minimum`}. ${includeHST ? `Includes ${Math.round(taxRate * 100)}% ${province === "ON" || province === "NS" || province === "NB" || province === "NL" || province === "PE" ? "HST" : province === "QC" ? "GST+QST" : province === "BC" || province === "SK" || province === "MB" ? "GST+PST" : "GST"}.` : "Tax excluded."}`
              : `Estimated lawyer costs${includeHST ? ` including ${Math.round(taxRate * 100)}% ${province === "ON" || province === "NS" || province === "NB" || province === "NL" || province === "PE" ? "HST" : province === "QC" ? "GST+QST" : province === "BC" || province === "SK" || province === "MB" ? "GST+PST" : "GST"}` : " (tax excluded)"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {potentialGap > 0 ? (
            <>
              {/* Context Information */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {currentOffer ? "Your Current Offer:" : "Statutory Minimum:"}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(currentOffer || totalStatutory)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommended Severance:</span>
                    <span className="font-semibold">{formatCurrency(recommendedRange.amount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">
                      {currentOffer ? "Potential Gap:" : "Potential Upside:"}
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(potentialGap)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Option */}
              <div className="rounded-lg border-2 border-primary p-4 bg-primary/5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Recommended: {analysis.recommended.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysis.recommended.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Fee:</span>
                    <span className="font-medium">{formatCurrency(analysis.recommended.baseCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({Math.round(taxRate * 100)}%):</span>
                    <span className="font-medium">{formatCurrency(analysis.recommended.tax)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Cost:</span>
                    <span className="font-bold text-lg">{formatCurrency(analysis.recommended.totalCost)}</span>
                  </div>
                  {analysis.recommended.netBenefit !== undefined && analysis.recommended.netBenefit > 0 && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          Estimated Net Benefit:
                        </span>
                        <span className="font-bold text-lg text-green-700 dark:text-green-300">
                          {formatCurrency(analysis.recommended.netBenefit)}
                        </span>
                      </div>
                      {annualSalary && annualSalary > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Net Take-Home:
                          </span>
                          <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                            {formatCurrency(calculateNetTakeHome(analysis.recommended).netTakeHome)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {analysis.recommended.estimatedRecovery !== undefined && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Estimated Recovery (after fees):
                        </span>
                        <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                          {formatCurrency(analysis.recommended.estimatedRecovery)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All Options Comparison */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">All Pricing Options:</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Click on any option to see your net take-home amount after lawyer fees
                </p>
                {analysis.options.map((option, index) => {
                  const optionId = `${option.type}-${index}`
                  const isExpanded = expandedOption === optionId
                  const netTakeHome = calculateNetTakeHome(option)

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 transition-all cursor-pointer ${option.type === analysis.recommended.type
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                        } ${isExpanded ? "bg-muted/30" : ""}`}
                      onClick={() => setExpandedOption(isExpanded ? null : optionId)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-sm flex items-center gap-2">
                              {option.name}
                              {option.type === analysis.recommended.type && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                  Recommended
                                </span>
                              )}
                            </h5>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </div>

                        {/* Inline Editing Controls - Beside Header */}
                        <div className="flex flex-col gap-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          {/* Custom Hours for Hourly Rate */}
                          {option.type === "hourly" && onCustomHoursChange && (
                            <div className="space-y-1">
                              <Label htmlFor={`hours-${index}`} className="text-xs font-medium">
                                Hours:
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`hours-${index}`}
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={customHours || ""}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value
                                    onCustomHoursChange(value === "" ? undefined : parseInt(value) || undefined)
                                  }}
                                  placeholder="Auto"
                                  className="h-8 text-xs"
                                />
                                {customHours !== undefined && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onCustomHoursChange(undefined)}
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Custom Flat Fee */}
                          {option.type === "flat" && onCustomFlatFeeChange && (
                            <div className="space-y-1">
                              <Label htmlFor={`flatfee-${index}`} className="text-xs font-medium">
                                Flat Fee:
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`flatfee-${index}`}
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={customFlatFee || ""}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value
                                    onCustomFlatFeeChange(value === "" ? undefined : parseInt(value) || undefined)
                                  }}
                                  placeholder="Default"
                                  className="h-8 text-xs"
                                />
                                {customFlatFee !== undefined && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onCustomFlatFeeChange(undefined)}
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Custom Contingency Percentage */}
                          {option.type === "contingency" && onCustomContingencyChange && (
                            <div className="space-y-1">
                              <Label htmlFor={`contingency-${index}`} className="text-xs font-medium">
                                Percentage:
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`contingency-${index}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={customContingencyPercentage || ""}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value
                                    onCustomContingencyChange(value === "" ? undefined : parseFloat(value) || undefined)
                                  }}
                                  placeholder="25%"
                                  className="h-8 text-xs"
                                />
                                <span className="text-xs text-muted-foreground self-center">%</span>
                                {customContingencyPercentage !== undefined && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onCustomContingencyChange(undefined)}
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Additional Tax Toggle */}
                          {onIncludeHSTChange && (
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Additional Tax:</Label>
                              <RadioGroup
                                value={includeHST ? "yes" : "no"}
                                onValueChange={(value: string) => onIncludeHSTChange(value === "yes")}
                                className="flex gap-3"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="yes" id={`hst-yes-${index}`} className="h-3 w-3" />
                                  <Label htmlFor={`hst-yes-${index}`} className="cursor-pointer text-xs">
                                    +{Math.round(getTaxRate(province as Province) * 100)}%
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="no" id={`hst-no-${index}`} className="h-3 w-3" />
                                  <Label htmlFor={`hst-no-${index}`} className="cursor-pointer text-xs">
                                    No
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Base:</span>
                            <p className="font-semibold">{formatCurrency(option.baseCost)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {includeHST ? "Additional Tax:" : "Tax:"}
                            </span>
                            <p className="font-semibold">{formatCurrency(option.tax)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <p className="font-semibold">{formatCurrency(option.totalCost)}</p>
                          </div>
                        </div>
                        {option.netBenefit !== undefined && option.netBenefit > 0 && (
                          <div className="mt-2 text-sm flex gap-4">
                            <div>
                              <span className="text-muted-foreground">Net Benefit: </span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(option.netBenefit)}
                              </span>
                            </div>
                            {annualSalary && annualSalary > 0 && (
                              <div>
                                <span className="text-muted-foreground">Net Take-Home: </span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(netTakeHome.netTakeHome)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded Net Take-Home Breakdown */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h6 className="font-semibold text-sm mb-3">Net Take-Home Breakdown:</h6>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {currentOffer ? "Your Current Offer:" : "Statutory Minimum:"}
                              </span>
                              <span className="font-medium">{formatCurrency(netTakeHome.startingAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Recommended Severance:</span>
                              <span className="font-medium text-primary">{formatCurrency(netTakeHome.recoveredAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Income Tax (estimated):</span>
                              <span className="font-medium text-destructive">-{formatCurrency(netTakeHome.incomeTax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lawyer Fees (incl. tax):</span>
                              <span className="font-medium text-destructive">-{formatCurrency(netTakeHome.lawyerFees)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center">
                              <span className="font-semibold">Net Take-Home:</span>
                              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                                {formatCurrency(netTakeHome.netTakeHome)}
                              </span>
                            </div>
                            <div className="rounded-md bg-green-50 dark:bg-green-950 p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Improvement Over {currentOffer ? "Your Offer" : "Statutory Minimum"}:
                                </span>
                                <span className="font-bold text-lg text-green-700 dark:text-green-300">
                                  {formatCurrency(netTakeHome.improvement)}
                                </span>
                              </div>
                            </div>
                            {option.type === "contingency" && (
                              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-2 text-xs text-blue-900 dark:text-blue-100">
                                <p className="font-medium mb-1">Note:</p>
                                <p>With contingency fees, you only pay if the lawyer successfully recovers additional severance. If unsuccessful, you pay nothing.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Decision Guide */}
              {decisionGuidance.length > 0 && (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsDecisionGuideExpanded(!isDecisionGuideExpanded)}
                  >
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      When to Choose Each Option
                    </h4>
                    {isDecisionGuideExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {isDecisionGuideExpanded && (
                    <div className="space-y-3">
                      {decisionGuidance.map((guide, index) => (
                        <div key={index} className="rounded-lg border p-4">
                          <h5 className="font-semibold text-sm mb-2">{guide.title}</h5>
                          <p className="text-xs text-muted-foreground mb-3">{guide.description}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium mb-1">When to Choose:</p>
                              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                {guide.whenToChoose.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1">Considerations:</p>
                              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                {guide.considerations.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-md bg-muted p-4 text-sm">
                <p className="font-semibold mb-2">Analysis Notes</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>All prices include applicable taxes ({Math.round(taxRate * 100)}% {province === "ON" || province === "NS" || province === "NB" || province === "NL" || province === "PE" ? "HST" : province === "QC" ? "GST+QST" : province === "BC" || province === "SK" || province === "MB" ? "GST+PST" : "GST"})</li>
                  <li>Hourly estimates are based on case complexity</li>
                  <li>Contingency fees are only paid if additional severance is recovered</li>
                  <li>Actual costs may vary based on lawyer and case specifics</li>
                  <li>Consider your risk tolerance and financial situation when choosing</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Enter your current severance offer above to see a detailed cost-benefit analysis comparing different lawyer pricing options.
              </p>
              <div className="space-y-3">
                {analysis.options.map((option, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <h5 className="font-semibold text-sm">{option.name}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Base: <span className="font-medium">{formatCurrency(option.baseCost)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        + Tax: <span className="font-medium">{formatCurrency(option.tax)}</span>
                      </span>
                      <span className="font-semibold">
                        Total: {formatCurrency(option.totalCost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demand Letter Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft Demand Letter
          </CardTitle>
          <CardDescription>
            Generate and customize a professional demand letter for your severance entitlements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleGenerateDemandLetter}
            size="lg"
          >
            Generate Demand Letter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
