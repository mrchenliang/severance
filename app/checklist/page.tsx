import { LaidOffChecklist } from "@/components/laid-off-checklist"

export default function ChecklistPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        <LaidOffChecklist />
      </div>
    </main>
  )
}
