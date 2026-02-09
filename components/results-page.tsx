"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Edit2 } from "lucide-react"
import { calculateSeverance } from "@/lib/calculations"
import { lawyerPricingByProvince } from "@/lib/lawyer-pricing"
import type { CalculatorInput, Province, AgeRange, JobPosition } from "@/lib/types"
import { CalculatorResults } from "./calculator-results"
import { getTaxRate } from "@/lib/tax-rates"

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

export function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [salaryInputType, setSalaryInputType] = useState<"annual" | "hourly">("annual")
  
  // Lawyer customization settings
  const [customHours, setCustomHours] = useState<number | undefined>(undefined)
  const [customContingencyPercentage, setCustomContingencyPercentage] = useState<number | undefined>(undefined)
  const [customFlatFee, setCustomFlatFee] = useState<number | undefined>(undefined)
  const [includeHST, setIncludeHST] = useState(true)

  // Parse URL params
  const [formData, setFormData] = useState<Partial<CalculatorInput>>(() => {
    const province = (searchParams.get("province") || "ON") as Province
    const yearsOfService = parseInt(searchParams.get("years") || "0")
    const monthsOfService = parseInt(searchParams.get("months") || "0")
    const ageRange = (searchParams.get("age") || "30-40") as AgeRange
    const jobPosition = (searchParams.get("position") || "professional") as JobPosition
    const salaryParam = searchParams.get("salary")
    const annualSalary = salaryParam ? parseFloat(salaryParam) : undefined
    const isUnionized = searchParams.get("unionized") === "true"
    const currentOffer = searchParams.get("offer") ? parseFloat(searchParams.get("offer")!) : undefined
    const employerPayroll = searchParams.get("payroll") ? parseFloat(searchParams.get("payroll")!) : undefined
    
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

  const companyName = searchParams.get("companyName") || ""
  const companyRepresentative = searchParams.get("companyRep") || ""

  const HOURS_PER_YEAR = 2080

  // Calculate results - handle hourly rate conversion if needed
  const annualSalaryForCalc = formData.annualSalary && salaryInputType === "hourly" 
    ? formData.annualSalary * HOURS_PER_YEAR 
    : formData.annualSalary

  const results = formData.province && formData.ageRange && formData.jobPosition && annualSalaryForCalc && annualSalaryForCalc > 0
    ? calculateSeverance({
        province: formData.province,
        yearsOfService: formData.yearsOfService || 0,
        monthsOfService: formData.monthsOfService ?? 0,
        ageRange: formData.ageRange,
        jobPosition: formData.jobPosition,
        annualSalary: annualSalaryForCalc,
        isUnionized: formData.isUnionized || false,
        currentOffer: formData.currentOffer,
        employerPayroll: formData.employerPayroll,
      })
    : null

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRecalculate = () => {
    setIsEditing(false)
    // Convert hourly to annual if needed
    const salaryForUrl = salaryInputType === "hourly" && formData.annualSalary
      ? formData.annualSalary * HOURS_PER_YEAR
      : formData.annualSalary
    
    // Update URL params
    const params = new URLSearchParams()
    if (formData.province) params.set("province", formData.province)
    if (formData.yearsOfService) params.set("years", String(formData.yearsOfService))
    if (formData.monthsOfService) params.set("months", String(formData.monthsOfService))
    if (formData.ageRange) params.set("age", formData.ageRange)
    if (formData.jobPosition) params.set("position", formData.jobPosition)
    if (salaryForUrl) params.set("salary", String(salaryForUrl))
    if (formData.isUnionized) params.set("unionized", "true")
    if (formData.currentOffer) params.set("offer", String(formData.currentOffer))
    if (formData.employerPayroll) params.set("payroll", String(formData.employerPayroll))
    
    router.push(`/results?${params.toString()}`)
  }

  if (!results) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Invalid or missing calculation data. Please go back and fill out the form.
            </p>
            <Button onClick={() => router.push("/")} className="mt-4 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Calculator
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            {isEditing ? "Done Editing" : "Edit Inputs"}
          </Button>
        </div>

        {isEditing ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Your Information</CardTitle>
              <CardDescription>
                Update your details and recalculate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Province */}
              <div className="space-y-2">
                <Label htmlFor="province">Province or Territory</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => handleFieldChange("province", value as Province)}
                >
                  <SelectTrigger id="province">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Union Status */}
              <div className="space-y-2">
                <Label>Are you unionized?</Label>
                <RadioGroup
                  value={formData.isUnionized ? "yes" : "no"}
                  onValueChange={(value) => handleFieldChange("isUnionized", value === "yes")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="union-yes" />
                    <Label htmlFor="union-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="union-no" />
                    <Label htmlFor="union-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {!formData.isUnionized && (
                <>
                  {/* Years/Months */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="years">Years of Service</Label>
                      <Input
                        id="years"
                        type="number"
                        min="0"
                        value={formData.yearsOfService || ""}
                        onChange={(e) => handleFieldChange("yearsOfService", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="months">Months of Service (Optional)</Label>
                      <Input
                        id="months"
                        type="number"
                        min="0"
                        max="11"
                        value={formData.monthsOfService ?? ""}
                        onChange={(e) => handleFieldChange("monthsOfService", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Age Range */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age Range</Label>
                    <Select
                      value={formData.ageRange}
                      onValueChange={(value) => handleFieldChange("ageRange", value as AgeRange)}
                    >
                      <SelectTrigger id="age">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_RANGES.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position">Job Position</Label>
                    <Select
                      value={formData.jobPosition}
                      onValueChange={(value) => handleFieldChange("jobPosition", value as JobPosition)}
                    >
                      <SelectTrigger id="position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_POSITIONS.map((position) => (
                          <SelectItem key={position.value} value={position.value}>
                            {position.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary */}
                  <div className="space-y-2">
                    <Label>
                      {salaryInputType === "annual" ? "Annual Salary" : "Hourly Rate"} (CAD)
                    </Label>
                    <div className="flex gap-4 mb-2">
                      <RadioGroup
                        value={salaryInputType}
                        onValueChange={(value) => setSalaryInputType(value as "annual" | "hourly")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="annual" id="salary-annual" />
                          <Label htmlFor="salary-annual" className="cursor-pointer text-sm">Annual Salary</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly" id="salary-hourly" />
                          <Label htmlFor="salary-hourly" className="cursor-pointer text-sm">Hourly Rate</Label>
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
                        if (value === "") {
                          handleFieldChange("annualSalary", undefined)
                        } else {
                          const numValue = parseInt(value, 10)
                          if (!isNaN(numValue) && numValue >= 0) {
                            handleFieldChange("annualSalary", numValue)
                          }
                        }
                      }}
                      placeholder={salaryInputType === "annual" ? "e.g., 75000" : "e.g., 36"}
                    />
                  </div>

                  {/* Current Offer */}
                  <div className="space-y-2">
                    <Label htmlFor="offer">Current Severance Offer (CAD) - Optional</Label>
                    <Input
                      id="offer"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.currentOffer || ""}
                      onChange={(e) => handleFieldChange("currentOffer", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      placeholder="e.g., 15000"
                    />
                  </div>

                  {/* Employer Payroll (Ontario) */}
                  {formData.province === "ON" && (
                    <div className="space-y-2">
                      <Label htmlFor="payroll">Employer Annual Payroll (CAD) - Optional</Label>
                      <Input
                        id="payroll"
                        type="number"
                        min="0"
                        step="100000"
                        value={formData.employerPayroll || ""}
                        onChange={(e) => handleFieldChange("employerPayroll", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        placeholder="Required for ESA severance (if ≥ $2.5M)"
                      />
                    </div>
                  )}
                </>
              )}

              <Button onClick={handleRecalculate} className="w-full" size="lg">
                Recalculate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CalculatorResults
            results={results}
            currentOffer={formData.currentOffer}
            province={formData.province!}
            lawyerPricing={lawyerPricingByProvince[formData.province!]}
            annualSalary={annualSalaryForCalc}
            yearsOfService={formData.yearsOfService}
            monthsOfService={formData.monthsOfService}
            ageRange={formData.ageRange}
            jobPosition={formData.jobPosition}
            companyName={companyName}
            companyRepresentative={companyRepresentative}
            customHours={customHours}
            customContingencyPercentage={customContingencyPercentage}
            customFlatFee={customFlatFee}
            includeHST={includeHST}
            onCustomHoursChange={setCustomHours}
            onCustomContingencyChange={setCustomContingencyPercentage}
            onCustomFlatFeeChange={setCustomFlatFee}
            onIncludeHSTChange={setIncludeHST}
          />
        )}
      </div>
    </div>
  )
}
