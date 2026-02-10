"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { DocumentProcessor } from "@/components/document-processor"

type TerminationType = "layoff" | "without-cause" | "with-cause" | null

interface TerminationInfo {
  title: string
  description: string
  rights: string[]
  considerations: string[]
  icon: React.ReactNode
  color: string
  bgColor: string
}

const terminationTypes: Record<string, TerminationInfo> = {
  layoff: {
    title: "Layoff (Temporary or Permanent)",
    description: "A layoff occurs when your employer eliminates your position due to business reasons such as restructuring, downsizing, or economic difficulties. This is not due to your performance.",
    rights: [
      "Entitled to reasonable notice or pay in lieu under common law",
      "Entitled to statutory minimum notice/severance pay",
      "May be eligible for Employment Insurance (EI) benefits",
      "Entitled to all accrued vacation pay and benefits",
      "May be entitled to additional severance if employer has payroll ≥ $2.5M (Ontario)",
    ],
    considerations: [
      "Layoffs are typically not your fault",
      "You may be rehired if the position becomes available again",
      "Your employer must provide proper notice or pay in lieu",
      "Common law entitlements are usually higher than statutory minimums",
    ],
    icon: <Info className="h-6 w-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  "without-cause": {
    title: "Termination Without Cause",
    description: "Your employment is being terminated, but not for reasons related to your performance or misconduct. This is a 'no-fault' termination.",
    rights: [
      "Entitled to reasonable notice or pay in lieu under common law",
      "Entitled to statutory minimum notice/severance pay",
      "May be eligible for Employment Insurance (EI) benefits",
      "Entitled to all accrued vacation pay and benefits",
      "May be entitled to additional severance if employer has payroll ≥ $2.5M (Ontario)",
      "Right to negotiate severance package before signing release",
    ],
    considerations: [
      "This is not a performance-based termination",
      "You have the right to negotiate your severance package",
      "Do not sign a release letter immediately - consult a lawyer first",
      "Common law entitlements are typically much higher than statutory minimums",
      "Your age, years of service, position, and job market conditions affect entitlements",
    ],
    icon: <CheckCircle2 className="h-6 w-6" />,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  "with-cause": {
    title: "Termination With Cause",
    description: "Your employment is being terminated due to serious misconduct, willful disobedience, or fundamental breach of your employment contract.",
    rights: [
      "May not be entitled to notice or severance pay if cause is proven",
      "May still be entitled to accrued vacation pay",
      "May not be eligible for Employment Insurance (EI) benefits",
      "Right to dispute the termination if cause is not justified",
    ],
    considerations: [
      "Employer must prove serious misconduct or fundamental breach",
      "Cause is difficult to prove - minor infractions typically don't qualify",
      "You have the right to challenge the termination",
      "Consult with an employment lawyer immediately",
      "Document everything - you may have a wrongful dismissal claim",
      "Do not sign anything admitting fault without legal advice",
    ],
    icon: <XCircle className="h-6 w-6" />,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
}

export function TerminationTypeTool() {
  const [selectedType, setSelectedType] = useState<TerminationType>(null)

  const selectedInfo = selectedType ? terminationTypes[selectedType] : null

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Understand Your Termination Type
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Knowing how you were terminated affects your legal rights and entitlements. Upload your document for automatic analysis, or select the type that best describes your situation.
        </p>
      </div>

      {/* Document Upload Section */}
      <div className="mb-8">
        <DocumentProcessor />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What type of termination applies to you?</CardTitle>
          <CardDescription>
            Select the option that best matches your situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedType || ""}
            onValueChange={(value) => setSelectedType(value as TerminationType)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="layoff" id="layoff" className="mt-1" />
              <Label htmlFor="layoff" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">Layoff</div>
                <div className="text-sm text-muted-foreground">
                  Your position was eliminated due to business reasons (restructuring, downsizing, economic difficulties)
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="without-cause" id="without-cause" className="mt-1" />
              <Label htmlFor="without-cause" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">Termination Without Cause</div>
                <div className="text-sm text-muted-foreground">
                  Your employment is ending, but not due to your performance or misconduct
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="with-cause" id="with-cause" className="mt-1" />
              <Label htmlFor="with-cause" className="flex-1 cursor-pointer">
                <div className="font-semibold mb-1">Termination With Cause</div>
                <div className="text-sm text-muted-foreground">
                  Your employment is ending due to serious misconduct or fundamental breach of contract
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedInfo && (
        <Card className={`${selectedInfo.bgColor} border-2`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={selectedInfo.color}>{selectedInfo.icon}</div>
              <div>
                <CardTitle className={selectedInfo.color}>{selectedInfo.title}</CardTitle>
                <CardDescription className="mt-2">{selectedInfo.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Your Rights & Entitlements
              </h3>
              <ul className="space-y-2">
                {selectedInfo.rights.map((right, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Important Considerations
              </h3>
              <ul className="space-y-2">
                {selectedInfo.considerations.map((consideration, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedType === "with-cause" && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Critical: Consult a Lawyer Immediately
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      If you believe the termination with cause is unjustified, you may have a wrongful dismissal claim. 
                      Do not sign any documents or admit fault without consulting an employment lawyer first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(selectedType === "layoff" || selectedType === "without-cause") && (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Next Steps
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      Use our severance calculator to determine what you're legally entitled to receive. 
                      Common law entitlements are typically much higher than statutory minimums.
                    </p>
                    <Link href="/calculator">
                      <Button variant="outline" size="sm" className="mt-2">
                        Calculate Your Severance Entitlements
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Important Disclaimer</p>
              <p className="text-muted-foreground">
                This tool provides general information only and does not constitute legal advice. 
                Termination situations can be complex, and your specific circumstances may vary. 
                It is strongly recommended that you consult with a qualified employment lawyer 
                to understand your rights and options based on your specific situation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
