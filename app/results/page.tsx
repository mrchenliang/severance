import { Suspense } from "react"
import { ResultsPage } from "@/components/results-page"
import { Loader2 } from "lucide-react"

export default function Results() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResultsPage />
    </Suspense>
  )
}
