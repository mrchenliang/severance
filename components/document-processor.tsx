"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ExtractedInfo {
  terminationType?: "layoff" | "without-cause" | "with-cause" | null
  severanceAmount?: number | null
  noticePeriod?: string | null
  releaseRequired?: boolean
  keyTerms: string[]
  detectedPhrases: string[]
  recommendations?: string[]
}

export function DocumentProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setFile(selectedFile)
      setError(null)
      setExtractedInfo(null)
    }
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const text = e.target?.result as string

        // Check if it's binary PDF data
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
          // Detect binary PDF data
          if (text.startsWith('%PDF') || (text.length > 500 && text.match(/[^\x20-\x7E]/g)?.length && text.match(/[^\x20-\x7E]/g)!.length > text.length * 0.3)) {
            reject(new Error("PDF files cannot be read directly in the browser. Please:\n\n1. Open the PDF document\n2. Select all text (Cmd/Ctrl+A) and copy it\n3. Paste the text into a .txt file and upload that, OR\n4. Copy-paste the text directly into a text editor and save as .txt\n\nAlternatively, you can manually select the termination type using the options below.")
            )
            return
          }
        }

        resolve(text)
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file. Please ensure the file is not corrupted."))
      }

      // For PDFs, try reading as text (will fail for binary PDFs, which we catch above)
      if (file.type === "text/plain" || file.type.includes("text") || file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        reader.readAsText(file)
      } else {
        // Try reading other file types as text
        reader.readAsText(file)
      }
    })
  }

  const analyzeDocumentWithAI = async (text: string): Promise<ExtractedInfo> => {
    try {
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // If API returned an error, fall back to basic analysis
      if (data.error && !data.terminationType) {
        console.warn("AI analysis returned error, using basic analysis:", data.error)
        return analyzeDocumentBasic(text)
      }

      // Convert AI response to our format
      const detectedPhrases: string[] = []

      if (data.terminationType) {
        detectedPhrases.push(
          data.terminationType === "layoff" ? "Layoff/Position Elimination" :
            data.terminationType === "without-cause" ? "Termination Without Cause" :
              "Termination With Cause"
        )
      }

      if (data.severanceAmount) {
        detectedPhrases.push(`Severance Amount: $${data.severanceAmount.toLocaleString()}`)
      }

      if (data.noticePeriod) {
        detectedPhrases.push(`Notice Period: ${data.noticePeriod}`)
      }

      if (data.releaseRequired) {
        detectedPhrases.push("Release Letter/Agreement Required")
      }

      // If API returned an error but still returned data, use it
      if (data.error && !data.terminationType && !data.summary) {
        // API error occurred, fall back to basic analysis
        console.warn("AI analysis returned error, using basic analysis:", data.error)
        return analyzeDocumentBasic(text)
      }

      return {
        terminationType: data.terminationType,
        severanceAmount: data.severanceAmount,
        noticePeriod: data.noticePeriod,
        releaseRequired: data.releaseRequired || false,
        keyTerms: data.keyTerms || [],
        detectedPhrases,
        recommendations: data.recommendations,
      }
    } catch (error) {
      console.error("AI analysis failed, falling back to basic analysis:", error)
      // Fallback to basic analysis
      return analyzeDocumentBasic(text)
    }
  }

  const analyzeDocumentBasic = (text: string): ExtractedInfo => {
    const lowerText = text.toLowerCase()
    const detectedPhrases: string[] = []
    const keyTerms: string[] = []

    // Detect termination type
    let terminationType: "layoff" | "without-cause" | "with-cause" | undefined

    if (lowerText.includes("layoff") || lowerText.includes("redundancy") ||
      lowerText.includes("restructuring") || lowerText.includes("downsizing") ||
      lowerText.includes("position eliminated")) {
      terminationType = "layoff"
      detectedPhrases.push("Layoff/Position Elimination")
    }

    if (lowerText.includes("without cause") || lowerText.includes("no cause") ||
      lowerText.includes("not for cause")) {
      terminationType = "without-cause"
      detectedPhrases.push("Termination Without Cause")
    }

    if (lowerText.includes("with cause") || lowerText.includes("for cause") ||
      lowerText.includes("misconduct") || lowerText.includes("breach") ||
      lowerText.includes("violation")) {
      terminationType = "with-cause"
      detectedPhrases.push("Termination With Cause")
    }

    // Detect severance amount
    const severanceMatches = text.match(/\$[\d,]+|\d+[\d,]*\s*(dollars|dollars?)/gi)
    if (severanceMatches) {
      detectedPhrases.push(`Severance Amount: ${severanceMatches[0]}`)
      const amount = severanceMatches[0].replace(/[^0-9]/g, "")
      if (amount) {
        keyTerms.push(`Severance: $${parseInt(amount).toLocaleString()}`)
      }
    }

    // Detect notice period
    const noticeMatches = text.match(/(\d+)\s*(weeks?|months?|days?)\s*(notice|severance)/gi)
    if (noticeMatches) {
      detectedPhrases.push(`Notice Period: ${noticeMatches[0]}`)
      keyTerms.push(`Notice: ${noticeMatches[0]}`)
    }

    // Detect release requirement
    const releaseRequired = lowerText.includes("release") ||
      lowerText.includes("waiver") ||
      lowerText.includes("settlement agreement")
    if (releaseRequired) {
      detectedPhrases.push("Release Letter/Agreement Required")
      keyTerms.push("Release Agreement Included")
    }

    // Detect other key terms
    if (lowerText.includes("vacation pay")) keyTerms.push("Vacation Pay")
    if (lowerText.includes("benefits")) keyTerms.push("Benefits Continuation")
    if (lowerText.includes("ei") || lowerText.includes("employment insurance")) {
      keyTerms.push("EI/EI Eligibility Mentioned")
    }
    if (lowerText.includes("confidentiality") || lowerText.includes("nda")) {
      keyTerms.push("Confidentiality/NDA Clause")
    }
    if (lowerText.includes("non-compete") || lowerText.includes("noncompete")) {
      keyTerms.push("Non-Compete Clause")
    }

    return {
      terminationType,
      releaseRequired,
      keyTerms,
      detectedPhrases,
    }
  }

  const processDocument = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      // For PDFs, send the file directly to the API for server-side extraction
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch("/api/analyze-document", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Handle error responses
        if (data.error && !data.terminationType) {
          throw new Error(data.details || data.error)
        }

        // Convert AI response to our format
        const detectedPhrases: string[] = []

        if (data.terminationType) {
          detectedPhrases.push(
            data.terminationType === "layoff" ? "Layoff/Position Elimination" :
              data.terminationType === "without-cause" ? "Termination Without Cause" :
                "Termination With Cause"
          )
        }

        if (data.severanceAmount) {
          detectedPhrases.push(`Severance Amount: $${data.severanceAmount.toLocaleString()}`)
        }

        if (data.noticePeriod) {
          detectedPhrases.push(`Notice Period: ${data.noticePeriod}`)
        }

        if (data.releaseRequired) {
          detectedPhrases.push("Release Letter/Agreement Required")
        }

        setExtractedInfo({
          terminationType: data.terminationType,
          severanceAmount: data.severanceAmount,
          noticePeriod: data.noticePeriod,
          releaseRequired: data.releaseRequired || false,
          keyTerms: data.keyTerms || [],
          detectedPhrases,
          recommendations: data.recommendations,
        })
      } else {
        // For text files, extract text and send to API
        const text = await extractTextFromFile(file)
        const info = await analyzeDocumentWithAI(text)
        setExtractedInfo(info)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setExtractedInfo(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Your Termination Document
          </CardTitle>
          <CardDescription>
            Upload your termination letter, severance package, or related documents.
            We'll analyze it to help identify key information. (PDF, TXT, DOCX supported)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Select Document</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="document-upload"
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={processDocument}
              disabled={!file || isProcessing}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Document
                </>
              )}
            </Button>
            {file && (
              <Button variant="outline" onClick={reset}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {extractedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedInfo.terminationType && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="font-semibold mb-2">Detected Termination Type:</div>
                <div className="text-lg">
                  {extractedInfo.terminationType === "layoff" && "Layoff"}
                  {extractedInfo.terminationType === "without-cause" && "Termination Without Cause"}
                  {extractedInfo.terminationType === "with-cause" && "Termination With Cause"}
                </div>
              </div>
            )}

            {extractedInfo.keyTerms.length > 0 && (
              <div>
                <div className="font-semibold mb-2">Key Terms Detected:</div>
                <div className="flex flex-wrap gap-2">
                  {extractedInfo.keyTerms.map((term, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}


            {extractedInfo.detectedPhrases.length > 0 && (
              <div>
                <div className="font-semibold mb-2">Detected Information:</div>
                <ul className="space-y-1">
                  {extractedInfo.detectedPhrases.map((phrase, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extractedInfo.recommendations && extractedInfo.recommendations.length > 0 && (
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Recommendations:
                </div>
                <ul className="space-y-2">
                  {extractedInfo.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extractedInfo.releaseRequired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Release Agreement Detected</AlertTitle>
                <AlertDescription>
                  Your document mentions a release or waiver. Do not sign it immediately.
                  Consult with an employment lawyer first to ensure you're receiving fair compensation.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Note</AlertTitle>
              <AlertDescription>
                This is an automated analysis and may not capture all details. Always review the
                full document carefully and consult with an employment lawyer for professional advice.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
