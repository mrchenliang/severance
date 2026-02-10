"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Calculator,
  Briefcase,
  FileText,
  DollarSign,
  Users,
  Mail,
  CreditCard,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle2,
  Circle,
  Info
} from "lucide-react"
import Link from "next/link"

interface ChecklistItem {
  id: string
  title: string
  description: string
  category: "immediate" | "legal" | "financial" | "career" | "benefits"
  priority: "high" | "medium" | "low"
  link?: string
  icon: React.ReactNode
}

const checklistItems: ChecklistItem[] = [
  {
    id: "calculate-severance",
    title: "Calculate Your Severance Entitlements",
    description: "Use our calculator to determine what you're legally entitled to receive",
    category: "immediate",
    priority: "high",
    link: "/calculator",
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    id: "review-severance-package",
    title: "Review Your Severance Package",
    description: "Carefully read all documents provided by your employer. The package typically includes a release letter - do not sign it right away. Consult with a lawyer first.",
    category: "immediate",
    priority: "high",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "consult-lawyer",
    title: "Consult with an Employment Lawyer",
    description: "Get professional legal advice before signing any documents",
    category: "legal",
    priority: "high",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: "file-ei",
    title: "File for Employment Insurance (EI)",
    description: "Apply for EI benefits as soon as possible - delays can affect eligibility",
    category: "financial",
    priority: "high",
    link: "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/eligibility.html",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "understand-benefits",
    title: "Understand Benefits Continuation",
    description: "Check if health, dental, or other benefits continue and for how long",
    category: "benefits",
    priority: "high",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: "request-reference",
    title: "Request a Reference Letter",
    description: "Ask your employer for a written reference letter while relationships are still positive",
    category: "career",
    priority: "medium",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "return-equipment",
    title: "Return Company Equipment",
    description: "Return laptops, phones, access cards, and other company property",
    category: "immediate",
    priority: "low",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "update-resume",
    title: "Update Your Resume and LinkedIn",
    description: "Refresh your professional profiles and highlight recent achievements",
    category: "career",
    priority: "high",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "network-contacts",
    title: "Reach Out to Your Network",
    description: "Contact former colleagues, mentors, and industry contacts",
    category: "career",
    priority: "high",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "review-finances",
    title: "Review Your Financial Situation",
    description: "Assess your savings, expenses, and create a budget for the transition period",
    category: "financial",
    priority: "high",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "negotiate-severance",
    title: "Consider Negotiating Your Severance",
    description: "If the offer seems low, negotiate before signing - you may be entitled to more",
    category: "legal",
    priority: "medium",
    link: "/",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "demand-letter",
    title: "Generate a Demand Letter (if needed)",
    description: "If negotiations fail, consider sending a formal demand letter",
    category: "legal",
    priority: "medium",
    link: "/demand-letter",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "understand-termination",
    title: "Understand Your Termination Type",
    description: "Know if it's a layoff, termination without cause, or termination with cause - this affects your rights",
    category: "legal",
    priority: "high",
    link: "/termination-type",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "check-contract",
    title: "Review Your Employment Contract",
    description: "Check for any termination clauses, non-compete agreements, or other relevant terms",
    category: "legal",
    priority: "medium",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "save-documents",
    title: "Save All Employment Documents",
    description: "Keep copies of your contract, termination letter, performance reviews, and any correspondence",
    category: "immediate",
    priority: "high",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "update-calendar",
    title: "Mark Important Deadlines",
    description: "Note deadlines for signing documents, filing EI, and other time-sensitive tasks",
    category: "immediate",
    priority: "high",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "explore-options",
    title: "Explore Career Options",
    description: "Consider if you want to return to similar work, change industries, or start your own business",
    category: "career",
    priority: "medium",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "mental-health",
    title: "Take Care of Your Mental Health",
    description: "Job loss can be stressful - consider talking to a counselor or therapist",
    category: "immediate",
    priority: "medium",
    icon: <Shield className="h-5 w-5" />,
  },
]

const categoryLabels = {
  immediate: "Immediate Actions",
  legal: "Legal Matters",
  financial: "Financial Planning",
  career: "Career Development",
  benefits: "Benefits & Insurance",
}

const priorityColors = {
  high: "text-destructive",
  medium: "text-yellow-600",
  low: "text-muted-foreground",
}

export function LaidOffChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("laid-off-checklist")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCheckedItems(new Set(parsed))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Save checked items to localStorage
  useEffect(() => {
    localStorage.setItem("laid-off-checklist", JSON.stringify(Array.from(checkedItems)))
  }, [checkedItems])

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearAll = () => {
    setCheckedItems(new Set())
  }

  const itemsByCategory = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const totalItems = checklistItems.length
  const completedItems = checkedItems.size
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Laid Off? Here's Your Action Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-4xl">
          A comprehensive checklist to help you navigate your layoff and protect your rights
        </p>
      </div>

      {/* Progress Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                {completedItems} of {totalItems} tasks completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{progressPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-3 mb-4">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      {Object.entries(itemsByCategory).map(([category, items]) => (
        <Card key={category} className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </CardTitle>
            <CardDescription>
              {items.filter((item) => checkedItems.has(item.id)).length} of {items.length} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => {
                const isChecked = checkedItems.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${isChecked ? "bg-muted/50 border-muted" : "bg-background"
                      }`}
                  >
                    <div className="mt-0.5">
                      <Checkbox
                        id={item.id}
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <div className={`mt-0.5 ${isChecked ? "text-muted-foreground" : ""}`}>
                          {item.icon}
                        </div>
                        <Label
                          htmlFor={item.id}
                          className={`text-base font-semibold cursor-pointer flex-1 ${isChecked ? "line-through text-muted-foreground" : ""
                            }`}
                        >
                          {item.title}
                        </Label>
                        <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm text-muted-foreground ml-7 ${isChecked ? "opacity-60" : ""}`}>
                        {item.description}
                      </p>
                      {item.link && (
                        <div className="mt-2 ml-7">
                          {item.link.startsWith("http") ? (
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-8 text-xs">
                                Learn More <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </a>
                          ) : (
                            <Link href={item.link}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs">
                                Get Started <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Footer Note */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Important Disclaimer</p>
              <p className="text-muted-foreground">
                This checklist is for informational purposes only and does not constitute legal or financial advice.
                Every situation is unique, and you should consult with qualified professionals (employment lawyers,
                financial advisors, etc.) for advice tailored to your specific circumstances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
