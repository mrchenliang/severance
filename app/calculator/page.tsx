import { Suspense } from "react"
import Link from "next/link"
import { SeveranceCalculator } from "@/components/severance-calculator"
import { Button } from "@/components/ui/button"
import { ListChecks } from "lucide-react"

function CalculatorWrapper() {
  return <SeveranceCalculator />
}

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Canadian Severance Pay Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-4">
            Calculate your severance pay entitlements based on common law across all Canadian provinces
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Back to Action Plan Checklist
            </Button>
          </Link>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <CalculatorWrapper />
        </Suspense>
      </div>
    </main>
  )
}
