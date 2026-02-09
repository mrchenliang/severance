export type Province =
  | "ON"
  | "BC"
  | "AB"
  | "SK"
  | "MB"
  | "NS"
  | "NB"
  | "NL"
  | "PE"
  | "NT"
  | "YT"
  | "NU"
  | "QC"
  | "Federal"

export type AgeRange =
  | "under-30"
  | "30-40"
  | "41-50"
  | "51-60"
  | "60-70"
  | "70+"

export type JobPosition =
  | "upper-management"
  | "middle-management"
  | "lower-management"
  | "salesperson"
  | "sales-manager"
  | "professional"
  | "labourer"
  | "clerical"
  | "technical"
  | "supervisor"
  | "social-services"

export interface CalculatorInput {
  province: Province
  yearsOfService: number
  monthsOfService: number
  ageRange: AgeRange
  jobPosition: JobPosition
  annualSalary: number
  isUnionized: boolean
  currentOffer?: number
  employerPayroll?: number // For Ontario ESA severance eligibility
}

export interface SeveranceResult {
  statutoryMinimum: {
    weeks: number
    amount: number
  }
  statutorySeverance?: {
    weeks: number
    amount: number
  }
  commonLawRange: {
    minWeeks: number
    maxWeeks: number
    minAmount: number
    maxAmount: number
  }
  recommendedRange: {
    weeks: number
    amount: number
  }
}

export interface LawyerPricing {
  province: Province
  consultationFee: {
    min: number
    max: number
    average: number
  }
  hourlyRate: {
    min: number
    max: number
    average: number
  }
  flatFeeRange?: {
    min: number
    max: number
  }
  contingencyFee?: {
    percentage: number
  }
}
