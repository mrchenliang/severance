import type {
  CalculatorInput,
  SeveranceResult,
  AgeRange,
  JobPosition,
} from "./types"

// Common law reasonable notice factors
function getAgeMultiplier(ageRange: AgeRange): number {
  const multipliers: Record<AgeRange, number> = {
    "under-30": 0.8,
    "30-40": 1.0,
    "41-50": 1.2,
    "51-60": 1.4,
    "60-70": 1.6,
    "70+": 1.8,
  }
  return multipliers[ageRange]
}

function getPositionMultiplier(jobPosition: JobPosition): number {
  const multipliers: Record<JobPosition, number> = {
    "upper-management": 1.8,
    "middle-management": 1.5,
    "lower-management": 1.3,
    "sales-manager": 1.4,
    professional: 1.2,
    supervisor: 1.1,
    technical: 1.0,
    clerical: 0.9,
    salesperson: 0.9,
    labourer: 0.8,
    "social-services": 1.0,
  }
  return multipliers[jobPosition]
}

function calculateCommonLawNotice(
  yearsOfService: number,
  monthsOfService: number,
  ageRange: AgeRange,
  jobPosition: JobPosition
): { minWeeks: number; maxWeeks: number } {
  const totalYears = yearsOfService + monthsOfService / 12
  const ageMultiplier = getAgeMultiplier(ageRange)
  const positionMultiplier = getPositionMultiplier(jobPosition)

  // Base calculation: typically 1-2 months per year of service
  // Range: 2-24 months depending on factors
  const baseMonths = Math.max(1, Math.min(2, totalYears))
  const adjustedMonths =
    baseMonths * totalYears * ageMultiplier * positionMultiplier

  // Minimum reasonable notice: 2-4 weeks for short service
  // Maximum: typically capped at 24 months
  const minMonths = Math.max(0.5, Math.min(adjustedMonths * 0.6, 6))
  const maxMonths = Math.min(adjustedMonths * 1.2, 24)

  return {
    minWeeks: Math.round(minMonths * 4.33),
    maxWeeks: Math.round(maxMonths * 4.33),
  }
}

// Statutory minimum notice periods by province
function getStatutoryNoticeWeeks(
  province: string,
  yearsOfService: number,
  monthsOfService: number
): number {
  const totalYears = yearsOfService + monthsOfService / 12
  const totalMonths = Math.floor(totalYears * 12)

  switch (province) {
    case "ON":
      // Ontario: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "BC":
      // BC: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "AB":
      // Alberta: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "SK":
      // Saskatchewan: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "MB":
      // Manitoba: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "NS":
      // Nova Scotia: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "NB":
      // New Brunswick: 1 week per year, max 4 weeks
      return Math.min(Math.floor(totalYears), 4)
    case "NL":
      // Newfoundland: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "PE":
      // PEI: 1 week per year, max 4 weeks
      return Math.min(Math.floor(totalYears), 4)
    case "NT":
    case "YT":
    case "NU":
      // Territories: 1 week per year, max 8 weeks
      return Math.min(Math.floor(totalYears), 8)
    case "QC":
      // Quebec: Different system, but similar calculation
      return Math.min(Math.floor(totalYears), 8)
    case "Federal":
      // Federal: 2 weeks after 1 year, then 1 week per year, max 8 weeks
      if (totalYears < 1) return 0
      return Math.min(2 + Math.floor(totalYears - 1), 8)
    default:
      return Math.min(Math.floor(totalYears), 8)
  }
}

// Statutory severance pay (Ontario specific)
function getStatutorySeveranceWeeks(
  province: string,
  yearsOfService: number,
  monthsOfService: number,
  employerPayroll?: number
): number | undefined {
  // Only Ontario has statutory severance pay requirement
  if (province !== "ON") return undefined

  const totalYears = yearsOfService + monthsOfService / 12

  // Ontario ESA severance: requires employer payroll >= $2.5M
  // 1 week per year of service, max 26 weeks
  if (employerPayroll && employerPayroll >= 2500000 && totalYears >= 5) {
    return Math.min(Math.floor(totalYears), 26)
  }

  return undefined
}

export function calculateSeverance(input: CalculatorInput): SeveranceResult {
  const { yearsOfService, monthsOfService, annualSalary, province } = input

  // Skip calculations for unionized employees (covered by collective agreements)
  if (input.isUnionized) {
    return {
      statutoryMinimum: { weeks: 0, amount: 0 },
      commonLawRange: { minWeeks: 0, maxWeeks: 0, minAmount: 0, maxAmount: 0 },
      recommendedRange: { weeks: 0, amount: 0 },
    }
  }

  const weeklySalary = annualSalary / 52

  // Statutory minimum termination pay
  const statutoryWeeks = getStatutoryNoticeWeeks(
    province,
    yearsOfService,
    monthsOfService
  )
  const statutoryAmount = Math.round(statutoryWeeks * weeklySalary)

  // Statutory severance (Ontario only)
  const severanceWeeks = getStatutorySeveranceWeeks(
    province,
    yearsOfService,
    monthsOfService,
    input.employerPayroll
  )
  const severanceAmount = severanceWeeks
    ? Math.round(severanceWeeks * weeklySalary)
    : undefined

  // Common law reasonable notice
  const commonLaw = calculateCommonLawNotice(
    yearsOfService,
    monthsOfService,
    input.ageRange,
    input.jobPosition
  )
  const commonLawMinAmount = Math.round(commonLaw.minWeeks * weeklySalary)
  const commonLawMaxAmount = Math.round(commonLaw.maxWeeks * weeklySalary)

  // Recommended range (middle of common law range)
  const recommendedWeeks = Math.round(
    (commonLaw.minWeeks + commonLaw.maxWeeks) / 2
  )
  const recommendedAmount = Math.round(recommendedWeeks * weeklySalary)

  return {
    statutoryMinimum: {
      weeks: statutoryWeeks,
      amount: statutoryAmount,
    },
    statutorySeverance: severanceWeeks
      ? {
          weeks: severanceWeeks,
          amount: severanceAmount!,
        }
      : undefined,
    commonLawRange: {
      minWeeks: commonLaw.minWeeks,
      maxWeeks: commonLaw.maxWeeks,
      minAmount: commonLawMinAmount,
      maxAmount: commonLawMaxAmount,
    },
    recommendedRange: {
      weeks: recommendedWeeks,
      amount: recommendedAmount,
    },
  }
}
