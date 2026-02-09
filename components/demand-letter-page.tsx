"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit } from "lucide-react"
import { calculateSeverance } from "@/lib/calculations"
import type { CalculatorInput, Province, AgeRange, JobPosition } from "@/lib/types"
import { DemandLetter } from "./demand-letter"

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount)
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}

export function DemandLetterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL params
  const province = (searchParams.get("province") || "ON") as Province
  const yearsOfService = parseInt(searchParams.get("years") || "0")
  const monthsOfService = parseInt(searchParams.get("months") || "0")
  const ageRange = (searchParams.get("age") || "30-40") as AgeRange
  const jobPosition = (searchParams.get("position") || "professional") as JobPosition
  const salaryParam = searchParams.get("salary")
  const annualSalary = salaryParam ? parseFloat(salaryParam) : undefined
  const isUnionized = searchParams.get("unionized") === "true"
  const currentOffer = searchParams.get("offer") ? parseFloat(searchParams.get("offer")!) : undefined
  const companyName = searchParams.get("companyName") || ""
  const companyRepresentative = searchParams.get("companyRep") || ""

  const HOURS_PER_YEAR = 2080
  const salaryInputType = searchParams.get("salaryType") === "hourly" ? "hourly" : "annual"
  const annualSalaryForCalc = annualSalary && salaryInputType === "hourly"
    ? annualSalary * HOURS_PER_YEAR
    : annualSalary

  // Calculate results
  const results = province && ageRange && jobPosition && annualSalaryForCalc && annualSalaryForCalc > 0 && !isUnionized
    ? calculateSeverance({
      province,
      yearsOfService,
      monthsOfService,
      ageRange,
      jobPosition,
      annualSalary: annualSalaryForCalc,
      isUnionized: false,
      currentOffer,
      employerPayroll: searchParams.get("payroll") ? parseFloat(searchParams.get("payroll")!) : undefined,
    })
    : null

  if (!results) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Demand Letter Generator</h1>
          <p className="text-muted-foreground mb-6">
            Please complete the calculator form first to generate your demand letter.
          </p>
          <Button onClick={() => router.push("/")}>
            Go to Calculator
          </Button>
        </div>
      </div>
    )
  }

  // Build URL params for navigation
  const buildCalculatorUrl = () => {
    const params = new URLSearchParams()
    params.set("province", province)
    params.set("years", String(yearsOfService))
    params.set("months", String(monthsOfService))
    params.set("age", ageRange)
    params.set("position", jobPosition)
    if (annualSalary) params.set("salary", String(annualSalary))
    if (salaryInputType === "hourly") params.set("salaryType", "hourly")
    if (currentOffer) params.set("offer", String(currentOffer))
    if (companyName) params.set("companyName", companyName)
    if (companyRepresentative) params.set("companyRep", companyRepresentative)
    return `/?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Draft Demand Letter
            </h1>
            <p className="text-lg text-muted-foreground">
              Customize and generate your severance demand letter
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl">
          {/* Edit Inputs Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Your Inputs
              </CardTitle>
              <CardDescription>
                Need to change your information? Go back to edit your calculator inputs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Province:</p>
                  <p className="text-sm text-muted-foreground">{province}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Years of Service:</p>
                  <p className="text-sm text-muted-foreground">
                    {yearsOfService} {yearsOfService === 1 ? "year" : "years"}
                    {monthsOfService > 0 && `, ${monthsOfService} ${monthsOfService === 1 ? "month" : "months"}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Age Range:</p>
                  <p className="text-sm text-muted-foreground">{ageRange}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Job Position:</p>
                  <p className="text-sm text-muted-foreground capitalize">{jobPosition}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Annual Salary:</p>
                  <p className="text-sm text-muted-foreground">
                    {annualSalaryForCalc ? formatCurrency(annualSalaryForCalc) : "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Current Offer:</p>
                  <p className="text-sm text-muted-foreground">
                    {currentOffer ? formatCurrency(currentOffer) : "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(buildCalculatorUrl())}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>

          <DemandLetter
            results={results}
            currentOffer={currentOffer}
            province={province}
            yearsOfService={yearsOfService}
            monthsOfService={monthsOfService}
            companyName={companyName}
            companyRepresentative={companyRepresentative}
          />
        </div>
      </div>
    </div>
  )
}
