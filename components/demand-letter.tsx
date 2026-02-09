"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"
import type { SeveranceResult, Province } from "@/lib/types"

interface DemandLetterProps {
  results: SeveranceResult
  currentOffer?: number
  province: string
  yearsOfService?: number
  monthsOfService?: number
  companyName?: string
  companyRepresentative?: string
}

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount)
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)
}

export function DemandLetter({
  results,
  currentOffer,
  province,
  yearsOfService = 0,
  monthsOfService = 0,
  companyName = "",
  companyRepresentative = "",
}: DemandLetterProps) {
  const [localCompanyName, setLocalCompanyName] = useState<string>(companyName)
  const [localCompanyRepresentative, setLocalCompanyRepresentative] = useState<string>(companyRepresentative)
  const [yourName, setYourName] = useState<string>("")
  const [editedLetter, setEditedLetter] = useState<string>("")
  const [hasManualEdit, setHasManualEdit] = useState<boolean>(false)
  const [tone, setTone] = useState<"professional" | "firm" | "concise" | "formal" | "collaborative">("professional")

  const { statutoryMinimum, statutorySeverance, commonLawRange, recommendedRange } = results
  const totalStatutory = statutoryMinimum.amount + (statutorySeverance?.amount || 0)

  // Auto-update letter when inputs change, unless user has manually edited it
  useEffect(() => {
    if (!hasManualEdit) {
      setEditedLetter("")
    }
  }, [localCompanyName, localCompanyRepresentative, yourName, currentOffer, recommendedRange.amount, tone, hasManualEdit])

  // Generate demand letter
  const generateDemandLetter = () => {
    const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    const company = localCompanyName || "[Company Name]"
    const representative = localCompanyRepresentative || "[Company Representative]"
    const salutation = localCompanyRepresentative ? `Dear ${localCompanyRepresentative},` : "Dear Sir/Madam,"

    // Format years and months of service
    let yearsText = ""
    if (yearsOfService > 0 && monthsOfService > 0) {
      yearsText = `${yearsOfService} year${yearsOfService !== 1 ? 's' : ''}, ${monthsOfService} month${monthsOfService !== 1 ? 's' : ''}`
    } else if (yearsOfService > 0) {
      yearsText = `${yearsOfService} year${yearsOfService !== 1 ? 's' : ''}`
    } else if (monthsOfService > 0) {
      yearsText = `${monthsOfService} month${monthsOfService !== 1 ? 's' : ''}`
    } else {
      yearsText = 'Less than 1 month'
    }

    // Tone-specific wording
    const tonePhrases = {
      professional: {
        opening: "I am writing to formally request payment of my severance entitlements in accordance with the termination of my employment.",
        offerResponse: currentOffer ? `I understand that you have offered ${formatCurrency(currentOffer)} as severance pay. However, this amount falls significantly below my common law entitlements.\n\n` : '',
        request: `I am requesting payment of ${formatCurrency(recommendedRange.amount)} as severance pay, which represents a reasonable amount based on common law principles, considering my age, length of service, position, and the availability of similar employment opportunities.`,
        deadline: "I would appreciate your response within 14 days of the date of this letter. If we are unable to resolve, I will have no choice but to pursue my legal remedies, including commencing legal proceedings to recover the full amount of my entitlements.",
        release: "I am prepared to provide a release letter upon receipt of the full severance payment in accordance with my entitlements.",
        closing: "I trust that we can resolve this matter amicably and look forward to your prompt response."
      },
      firm: {
        opening: "I am writing to demand payment of my severance entitlements following the termination of my employment.",
        offerResponse: currentOffer ? `Your offer of ${formatCurrency(currentOffer)} is unacceptable and does not meet my legal entitlements under common law.\n\n` : '',
        request: `I require payment of ${formatCurrency(recommendedRange.amount)} as severance pay, which represents the minimum amount I am entitled to under common law given my age, length of service, position, and the difficulty of finding similar employment.`,
        deadline: "I expect your response within 14 days of the date of this letter. Should we be unable to reach an agreement, I will proceed with legal action to recover the full amount of my entitlements, including costs.",
        release: "I will provide a release letter upon receipt of the full severance payment that I am legally entitled to.",
        closing: "This matter requires your immediate attention. I await your response within the stated timeframe."
      },
      concise: {
        opening: "I am requesting payment of my severance entitlements following the termination of my employment.",
        offerResponse: currentOffer ? `Your offer of ${formatCurrency(currentOffer)} is below my legal entitlements.\n\n` : '',
        request: `I am entitled to ${formatCurrency(recommendedRange.amount)} in severance pay based on common law principles, considering my age, service length, position, and employment market conditions.`,
        deadline: "Please respond within 14 days. If unresolved, I will pursue legal action to recover my full entitlements.",
        release: "I will provide a release letter upon receipt of the full severance payment.",
        closing: "I look forward to your response."
      },
      formal: {
        opening: "I am writing to formally assert my legal right to severance pay in accordance with the termination of my employment relationship.",
        offerResponse: currentOffer ? `I note that you have proposed ${formatCurrency(currentOffer)} as severance pay. This proposal does not reflect my entitlements under common law principles.\n\n` : '',
        request: `Pursuant to common law principles applicable in ${province}, I am entitled to severance pay in the amount of ${formatCurrency(recommendedRange.amount)}, which reflects reasonable notice based on the factors of my age, years of service, position, and the availability of comparable employment.`,
        deadline: "I require a response to this matter within 14 days of the date hereof. In the event that we are unable to resolve this matter, I reserve the right to pursue all available legal remedies, including but not limited to commencing legal proceedings to recover the full amount of my entitlements, together with costs and interest.",
        release: "Upon receipt of the full severance payment to which I am entitled, I will execute and deliver a release letter in a form acceptable to both parties.",
        closing: "I trust that this matter can be resolved without the need for litigation. I await your response."
      },
      collaborative: {
        opening: "I am writing to discuss my severance entitlements following the termination of my employment.",
        offerResponse: currentOffer ? `I have received your offer of ${formatCurrency(currentOffer)}. While I appreciate the offer, I believe we can work together to reach an amount that better reflects my legal entitlements.\n\n` : '',
        request: `Based on common law principles, I believe a fair severance amount would be ${formatCurrency(recommendedRange.amount)}, which takes into account my age, length of service, position, and the current employment market. I am open to discussing this amount and finding a mutually acceptable resolution.`,
        deadline: "I would appreciate the opportunity to discuss this matter with you within the next 14 days. I am confident we can reach an agreement that works for both parties, but I must also protect my legal rights if we are unable to resolve this amicably.",
        release: "I am happy to provide a release letter as part of a fair settlement agreement once we have reached a resolution.",
        closing: "I hope we can resolve this matter through open dialogue. Please let me know when we can discuss this further."
      }
    }

    const phrases = tonePhrases[tone]

    return `Date: ${today}

${company}${representative && representative !== "[Company Representative]" ? `\nAttn: ${representative}` : ''}

${salutation}

Re: Severance Pay Entitlement

${phrases.opening}

Based on my employment history and the common law principles applicable in ${province}, I am entitled to reasonable notice of termination or pay in lieu thereof. My entitlements are as follows:

• Years of Service: ${yearsText}
• Statutory Minimum Entitlement: ${formatCurrency(totalStatutory)}
• Common Law Entitlement Range: ${formatCurrency(commonLawRange.minAmount)} - ${formatCurrency(commonLawRange.maxAmount)}
• Recommended Severance Amount: ${formatCurrency(recommendedRange.amount)}

${phrases.offerResponse}${phrases.request}

${phrases.deadline}

${phrases.release}

${phrases.closing}

Yours truly,

${yourName || "[Your Name]"}`
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft Demand Letter
          </CardTitle>
          <CardDescription>
            Review and customize the draft demand letter below. This is a template and should be reviewed by legal counsel before sending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Company Information Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demand-company-name">Company Name</Label>
                <Input
                  id="demand-company-name"
                  type="text"
                  value={localCompanyName}
                  onChange={(e) => setLocalCompanyName(e.target.value)}
                  placeholder="e.g., ABC Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demand-company-rep">Company Representative Name</Label>
                <Input
                  id="demand-company-rep"
                  type="text"
                  value={localCompanyRepresentative}
                  onChange={(e) => setLocalCompanyRepresentative(e.target.value)}
                  placeholder="e.g., John Smith, HR Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demand-your-name">Your Name</Label>
                <Input
                  id="demand-your-name"
                  type="text"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label htmlFor="demand-tone">Tone of Voice</Label>
              <Select value={tone} onValueChange={(value: "professional" | "firm" | "concise" | "formal" | "collaborative") => setTone(value)}>
                <SelectTrigger id="demand-tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional - Balanced and Respectful</SelectItem>
                  <SelectItem value="firm">Firm - Direct and Assertive</SelectItem>
                  <SelectItem value="concise">Concise - Brief and To-the-Point</SelectItem>
                  <SelectItem value="formal">Formal - Legal and Precise</SelectItem>
                  <SelectItem value="collaborative">Collaborative - Open to Discussion</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {tone === "professional"
                  ? "Balanced, respectful tone that maintains professionalism while clearly asserting your rights."
                  : tone === "firm"
                    ? "Direct and assertive tone that emphasizes your legal entitlements and willingness to take action."
                    : tone === "concise"
                      ? "Brief and straightforward tone that gets to the point quickly without unnecessary words."
                      : tone === "formal"
                        ? "Formal legal tone with precise language suitable for formal legal correspondence."
                        : "Collaborative tone that emphasizes open dialogue and finding a mutually acceptable solution."}
              </p>
            </div>

            {/* Demand Letter Preview */}
            {(localCompanyName || localCompanyRepresentative) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="demand-letter">Demand Letter</Label>
                  <Textarea
                    id="demand-letter"
                    value={editedLetter || generateDemandLetter()}
                    onChange={(e) => {
                      setEditedLetter(e.target.value)
                      setHasManualEdit(true)
                    }}
                    className="min-h-[800px] w-full font-mono text-sm whitespace-pre-wrap"
                    placeholder="Demand letter will appear here..."
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const letter = editedLetter || generateDemandLetter()
                        navigator.clipboard.writeText(letter)
                      }}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const letter = editedLetter || generateDemandLetter()
                        const blob = new Blob([letter], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `demand-letter-${new Date().toISOString().split('T')[0]}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                    >
                      Download as Text
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedLetter("")
                        setHasManualEdit(false)
                      }}
                    >
                      Reset to Template
                    </Button>
                  </div>
                </div>
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-900 dark:text-yellow-100">
                  <p className="font-medium mb-1">Important Disclaimer:</p>
                  <p>This is a draft template only and does not constitute legal advice. You should consult with a qualified employment lawyer before sending any demand letter to your employer. The information provided is for informational purposes only.</p>
                </div>
              </>
            )}

            {!localCompanyName && !localCompanyRepresentative && (
              <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                <p>Enter company name and representative information above to generate a personalized demand letter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
