import { Suspense } from "react"
import { SeveranceCalculator } from "@/components/severance-calculator"

function CalculatorWrapper() {
  return <SeveranceCalculator />
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Canadian Severance Pay Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculate your severance pay entitlements based on common law across all Canadian provinces
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <CalculatorWrapper />
        </Suspense>
      </div>
    </main>
  )
}
