"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { calculateSeverance } from "@/lib/calculations"
import { lawyerPricingByProvince } from "@/lib/lawyer-pricing"
import type { CalculatorInput, Province, AgeRange, JobPosition } from "@/lib/types"

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount)
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}

const PROVINCES: { value: Province; label: string }[] = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "SK", label: "Saskatchewan" },
  { value: "MB", label: "Manitoba" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "NT", label: "Northwest Territories" },
  { value: "YT", label: "Yukon" },
  { value: "NU", label: "Nunavut" },
  { value: "QC", label: "Quebec" },
  { value: "Federal", label: "Federal" },
]

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: "under-30", label: "Under 30" },
  { value: "30-40", label: "30-40" },
  { value: "41-50", label: "41-50" },
  { value: "51-60", label: "51-60" },
  { value: "60-70", label: "60-70" },
  { value: "70+", label: "70+" },
]

const JOB_POSITIONS: { value: JobPosition; label: string }[] = [
  { value: "upper-management", label: "Upper Management" },
  { value: "middle-management", label: "Middle Management" },
  { value: "lower-management", label: "Lower Management" },
  { value: "sales-manager", label: "Sales Manager" },
  { value: "professional", label: "Professional" },
  { value: "supervisor", label: "Supervisor" },
  { value: "technical", label: "Technical" },
  { value: "clerical", label: "Clerical" },
  { value: "salesperson", label: "Salesperson" },
  { value: "labourer", label: "Labourer" },
  { value: "social-services", label: "Social Services" },
]

export function SeveranceCalculator() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Convert hourly rate to annual salary (assuming 40 hours/week × 52 weeks = 2080 hours/year)
  const HOURS_PER_YEAR = 2080

  // Initialize from URL params if available
  const initialSalaryInputType = searchParams.get("salaryType") === "hourly" ? "hourly" : "annual"
  const [salaryInputType, setSalaryInputType] = useState<"annual" | "hourly">(initialSalaryInputType)

  const [formData, setFormData] = useState<Partial<CalculatorInput>>(() => {
    const province = (searchParams.get("province") || "ON") as Province
    const yearsOfService = parseInt(searchParams.get("years") || "0")
    const monthsOfService = parseInt(searchParams.get("months") || "0")
    const ageRange = (searchParams.get("age") || "30-40") as AgeRange
    const jobPosition = (searchParams.get("position") || "professional") as JobPosition
    const salaryParam = searchParams.get("salary")
    const isUnionized = searchParams.get("unionized") === "true"
    const currentOffer = searchParams.get("offer") ? parseFloat(searchParams.get("offer")!) : undefined
    const employerPayroll = searchParams.get("payroll") ? parseFloat(searchParams.get("payroll")!) : undefined

    // Handle salary conversion based on input type
    let annualSalary: number | undefined = undefined
    if (salaryParam) {
      const salaryValue = parseFloat(salaryParam)
      if (initialSalaryInputType === "hourly") {
        // If URL has hourly, convert back to hourly rate for display
        annualSalary = salaryValue / HOURS_PER_YEAR
      } else {
        // If URL has annual, use as is
        annualSalary = salaryValue
      }
    }

    return {
      province,
      yearsOfService,
      monthsOfService,
      ageRange,
      jobPosition,
      annualSalary,
      isUnionized,
      currentOffer,
      employerPayroll,
    }
  })

  const [companyName, setCompanyName] = useState<string>(searchParams.get("companyName") || "")
  const [companyRepresentative, setCompanyRepresentative] = useState<string>(searchParams.get("companyRep") || "")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "province":
        return !value ? "Province or territory is required" : ""
      case "isUnionized":
        return value === undefined ? "Please select union status" : ""
      case "yearsOfService":
        if (formData.isUnionized) return ""
        return value === undefined || value === null || value === "" || value < 0
          ? "Years of service is required"
          : ""
      case "ageRange":
        if (formData.isUnionized) return ""
        return !value ? "Age range is required" : ""
      case "jobPosition":
        if (formData.isUnionized) return ""
        return !value ? "Job position is required" : ""
      case "annualSalary":
        if (formData.isUnionized) return ""
        return !value || value <= 0
          ? salaryInputType === "annual"
            ? "Annual salary must be greater than 0"
            : "Hourly rate must be greater than 0"
          : ""
      default:
        return ""
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Always validate province and union status
    const provinceError = validateField("province", formData.province)
    if (provinceError) newErrors.province = provinceError

    const unionError = validateField("isUnionized", formData.isUnionized)
    if (unionError) newErrors.isUnionized = unionError

    // Only validate other fields if not unionized
    if (!formData.isUnionized) {
      const yearsError = validateField("yearsOfService", formData.yearsOfService)
      if (yearsError) newErrors.yearsOfService = yearsError

      const ageError = validateField("ageRange", formData.ageRange)
      if (ageError) newErrors.ageRange = ageError

      const positionError = validateField("jobPosition", formData.jobPosition)
      if (positionError) newErrors.jobPosition = positionError

      const salaryError = validateField("annualSalary", formData.annualSalary)
      if (salaryError) newErrors.annualSalary = salaryError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {
      province: true,
      isUnionized: true,
      yearsOfService: true,
      ageRange: true,
      jobPosition: true,
      annualSalary: true,
    }
    setTouched(allTouched)

    if (validateForm()) {
      // Convert hourly rate to annual salary if needed
      let annualSalary = formData.annualSalary!
      if (salaryInputType === "hourly" && formData.annualSalary) {
        annualSalary = formData.annualSalary * HOURS_PER_YEAR
      }

      // Build URL params
      const params = new URLSearchParams()
      params.set("province", formData.province!)
      params.set("years", String(formData.yearsOfService || 0))
      params.set("months", String(formData.monthsOfService ?? 0))
      params.set("age", formData.ageRange!)
      params.set("position", formData.jobPosition!)
      params.set("salary", String(annualSalary))
      if (formData.isUnionized) params.set("unionized", "true")
      if (formData.currentOffer) params.set("offer", String(formData.currentOffer))
      if (formData.employerPayroll) params.set("payroll", String(formData.employerPayroll))
      if (companyName) params.set("companyName", companyName)
      if (companyRepresentative) params.set("companyRep", companyRepresentative)

      // Navigate to results page
      router.push(`/results?${params.toString()}`)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Clear error when field is updated
    if (errors[name]) {
      const error = validateField(name, value)
      if (!error) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      } else {
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    }
  }

  const isOntario = formData.province === "ON"

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Canadian Severance Pay Calculator</CardTitle>
          <CardDescription>
            This calculator provides an estimate of severance pay based on common law across Canadian provinces.
            Results are for general illustrative purposes only and do not constitute legal advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Province Selection */}
            <div className="space-y-2">
              <Label htmlFor="province">Province or Territory <span className="text-destructive">*</span></Label>
              <Select
                value={formData.province}
                onValueChange={(value) =>
                  handleFieldChange("province", value as Province)
                }
              >
                <SelectTrigger id="province" className={errors.province ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.province && errors.province && (
                <p className="text-sm text-destructive">{errors.province}</p>
              )}
            </div>

            {/* Union Status */}
            <div className="space-y-2">
              <Label>Are you unionized? <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={formData.isUnionized ? "yes" : "no"}
                onValueChange={(value) => {
                  const isUnionized = value === "yes"
                  handleFieldChange("isUnionized", isUnionized)
                  // Clear errors for fields that are no longer required
                  if (isUnionized) {
                    setErrors((prev) => {
                      const newErrors = { ...prev }
                      delete newErrors.yearsOfService
                      delete newErrors.ageRange
                      delete newErrors.jobPosition
                      delete newErrors.annualSalary
                      return newErrors
                    })
                  }
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="union-yes" />
                  <Label htmlFor="union-yes" className="cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="union-no" />
                  <Label htmlFor="union-no" className="cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
              {touched.isUnionized && errors.isUnionized && (
                <p className="text-sm text-destructive">{errors.isUnionized}</p>
              )}
            </div>

            {!formData.isUnionized && (
              <>
                {/* Years of Service */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years">Years of Service <span className="text-destructive">*</span></Label>
                    <Input
                      id="years"
                      type="number"
                      min="0"
                      value={formData.yearsOfService || ""}
                      onChange={(e) =>
                        handleFieldChange("yearsOfService", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)
                      }
                      className={errors.yearsOfService ? "border-destructive" : ""}
                    />
                    {touched.yearsOfService && errors.yearsOfService && (
                      <p className="text-sm text-destructive">{errors.yearsOfService}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="months">Months of Service (Optional)</Label>
                    <Input
                      id="months"
                      type="number"
                      min="0"
                      max="11"
                      value={formData.monthsOfService ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthsOfService: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Age Range */}
                <div className="space-y-2">
                  <Label htmlFor="age">Age Range <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.ageRange}
                    onValueChange={(value) =>
                      handleFieldChange("ageRange", value as AgeRange)
                    }
                  >
                    <SelectTrigger id="age" className={errors.ageRange ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.ageRange && errors.ageRange && (
                    <p className="text-sm text-destructive">{errors.ageRange}</p>
                  )}
                </div>

                {/* Job Position */}
                <div className="space-y-2">
                  <Label htmlFor="position">Job Position <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.jobPosition}
                    onValueChange={(value) =>
                      handleFieldChange("jobPosition", value as JobPosition)
                    }
                  >
                    <SelectTrigger id="position" className={errors.jobPosition ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_POSITIONS.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.jobPosition && errors.jobPosition && (
                    <p className="text-sm text-destructive">{errors.jobPosition}</p>
                  )}
                </div>

                {/* Annual Salary / Hourly Rate */}
                <div className="space-y-2">
                  <Label>
                    {salaryInputType === "annual" ? "Annual Salary" : "Hourly Rate"} (CAD){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-4 mb-2">
                    <RadioGroup
                      value={salaryInputType}
                      onValueChange={(value) => {
                        setSalaryInputType(value as "annual" | "hourly")
                        // Reset salary when switching types
                        setFormData({ ...formData, annualSalary: undefined })
                        setErrors((prev) => {
                          const newErrors = { ...prev }
                          delete newErrors.annualSalary
                          return newErrors
                        })
                        setTouched((prev) => {
                          const newTouched = { ...prev }
                          delete newTouched.annualSalary
                          return newTouched
                        })
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="annual" id="salary-annual" />
                        <Label htmlFor="salary-annual" className="cursor-pointer text-sm">
                          Annual Salary
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="salary-hourly" />
                        <Label htmlFor="salary-hourly" className="cursor-pointer text-sm">
                          Hourly Rate
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.annualSalary !== undefined && formData.annualSalary !== null ? formData.annualSalary : ""}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow whole numbers (no decimals)
                      if (value === "") {
                        handleFieldChange("annualSalary", undefined)
                      } else {
                        const numValue = parseInt(value, 10)
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleFieldChange("annualSalary", numValue)
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent decimal point and other non-numeric characters except backspace, delete, arrow keys
                      if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                        e.preventDefault()
                      }
                    }}
                    placeholder={
                      salaryInputType === "annual" ? "e.g., 75000" : "e.g., 36"
                    }
                    className={errors.annualSalary ? "border-destructive" : ""}
                  />
                  {salaryInputType === "hourly" && formData.annualSalary !== undefined && formData.annualSalary !== null && formData.annualSalary > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Equivalent to approximately {formatCurrency(formData.annualSalary * HOURS_PER_YEAR)} per year
                      (based on 40 hours/week × 52 weeks)
                    </p>
                  )}
                  {touched.annualSalary && errors.annualSalary && (
                    <p className="text-sm text-destructive">{errors.annualSalary}</p>
                  )}
                </div>

                {/* Ontario-specific: Employer Payroll */}
                {isOntario && (
                  <div className="space-y-2">
                    <Label htmlFor="payroll">
                      Employer Annual Payroll (CAD) - Optional
                    </Label>
                    <Input
                      id="payroll"
                      type="number"
                      min="0"
                      step="100000"
                      value={formData.employerPayroll || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employerPayroll: parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="Required for ESA severance (if ≥ $2.5M)"
                    />
                    <p className="text-sm text-muted-foreground">
                      Ontario ESA severance pay requires employer payroll of $2.5M or more
                    </p>
                  </div>
                )}

                {/* Current Offer */}
                <div className="space-y-2">
                  <Label htmlFor="offer">
                    Current Severance Offer from Employer (CAD) - Optional
                  </Label>
                  <Input
                    id="offer"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.currentOffer || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentOffer: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 15000"
                  />
                </div>

                {/* Company Information - Optional */}
                <div className="space-y-4 pt-2 border-t">
                  <h3 className="text-sm font-semibold">Company Information (Optional)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g., ABC Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRep">
                      Company Representative Name
                    </Label>
                    <Input
                      id="companyRep"
                      type="text"
                      value={companyRepresentative}
                      onChange={(e) => setCompanyRepresentative(e.target.value)}
                      placeholder="e.g., John Smith, HR Manager"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This information will be used to generate a draft demand letter if provided.
                  </p>
                </div>
              </>
            )}

            {formData.isUnionized && (
              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                This calculator is designed for non-unionized employees. Unionized employees
                should consult their collective agreement and union representative for guidance
                on severance entitlements.
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Calculate Severance Pay
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
