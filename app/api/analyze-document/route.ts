import { NextRequest, NextResponse } from "next/server"
// @ts-ignore - pdf-parse doesn't have perfect TypeScript support
import pdfParse from "pdf-parse"

// PDF text extraction using pdf-parse library
async function extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log("PDF Buffer Info:")
    console.log("- Buffer size:", buffer.byteLength, "bytes")

    // Convert ArrayBuffer to Buffer (Node.js Buffer)
    const nodeBuffer = Buffer.from(buffer)

    // Use pdf-parse to extract text
    const pdfData = await pdfParse(nodeBuffer)

    console.log("PDF Extraction Results:")
    console.log("- Pages:", pdfData.numpages)
    console.log("- Extracted text length:", pdfData.text.length)
    console.log("- First 1000 chars of extracted text:", pdfData.text.substring(0, 1000))
    console.log("- Last 500 chars of extracted text:", pdfData.text.substring(Math.max(0, pdfData.text.length - 500)))

    if (!pdfData.text || pdfData.text.trim().length < 50) {
      console.error("PDF extraction failed - insufficient text extracted")
      throw new Error("Could not extract sufficient text from PDF. The PDF may be image-based or encrypted.")
    }

    return pdfData.text
  } catch (error) {
    console.error("PDF parsing error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Failed to extract text from PDF: ${errorMessage}. The PDF may be encrypted, image-based, or corrupted.`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let text: string

    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        console.log("Processing PDF file:")
        console.log("- File name:", file.name)
        console.log("- File type:", file.type)
        console.log("- File size:", file.size, "bytes")
        // Extract text from PDF
        text = await extractTextFromPDFBuffer(arrayBuffer)
        console.log("PDF extraction complete. Extracted text length:", text.length)
      } else {
        // Read text files
        console.log("Processing text file:", file.name, "Type:", file.type)
        text = new TextDecoder('utf-8').decode(arrayBuffer)
        console.log("Text file content length:", text.length)
      }
    } else {
      // Handle JSON (text input from frontend)
      const body = await request.json()
      text = body.text

      console.log("Received JSON text input:")
      console.log("- Text length:", text?.length || 0)
      console.log("- First 500 chars:", text?.substring(0, 500) || "N/A")

      if (!text || typeof text !== "string") {
        return NextResponse.json(
          { error: "Text content is required" },
          { status: 400 }
        )
      }
    }

    console.log("Final text to analyze:")
    console.log("- Length:", text.length)
    console.log("- First 1000 chars:", text.substring(0, 1000))
    console.log("- Last 500 chars:", text.substring(Math.max(0, text.length - 500)))

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No readable text content found" },
        { status: 400 }
      )
    }

    // Use Kimi API (Moonshot AI)
    const apiKey = process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY

    if (!apiKey) {
      // Fallback to basic analysis if no API key
      return NextResponse.json({
        terminationType: null,
        severanceAmount: null,
        noticePeriod: null,
        releaseRequired: false,
        keyTerms: [],
        detectedPhrases: [],
      })
    }

    // Log API key prefix for debugging (first 10 chars only for security)
    console.log("Using API key:", apiKey.substring(0, 10) + "...")

    const prompt = `Analyze this employment termination document. Return ONLY valid JSON, no other text. Keep responses brief and concise.

{
  "terminationType": "layoff" | "without-cause" | "with-cause" | null,
  "severanceAmount": number or null,
  "noticePeriod": "X weeks" or null,
  "releaseRequired": boolean,
  "keyTerms": ["term1", "term2"],
  "recommendations": ["rec1", "rec2"]
}

Document:
${text.substring(0, 6000)}

Rules:
- Maximum 3 key terms
- Maximum 2 recommendations (one sentence each)
- Be concise - this is a summary, not full analysis`

    // Kimi API endpoint (Moonshot AI - International version)
    const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.5", // Kimi K2.5 model
        messages: [
          {
            role: "system",
            content: "You are a legal document analyzer specializing in employment termination documents. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1, // Kimi K2.5 only allows temperature of 1
        max_tokens: 1000, // Reduced for concise responses
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Kimi API error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
        console.error("Kimi API error details:", errorJson)

        // If authentication fails, return null to trigger fallback
        if (response.status === 401 || errorMessage.includes("Authentication")) {
          console.warn("Kimi API authentication failed, falling back to basic analysis")
          return NextResponse.json({
            terminationType: null,
            severanceAmount: null,
            noticePeriod: null,
            releaseRequired: false,
            keyTerms: [],
            detectedPhrases: [],
            error: "API authentication failed - using fallback analysis",
          })
        }
      } catch {
        console.error("Kimi API error:", errorText)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Kimi API response structure:", JSON.stringify(data, null, 2))

    // Log the message object specifically
    if (data.choices?.[0]?.message) {
      console.log("Message object:", JSON.stringify(data.choices[0].message, null, 2))
    }

    // Check if response was truncated
    const finishReason = data.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      console.warn("⚠️ Response was truncated due to max_tokens limit. Consider increasing max_tokens or reducing input size.")
    }

    // Handle different response structures
    // Kimi K2.5 may put content in reasoning_content instead of content
    const message = data.choices?.[0]?.message
    let content = message?.content ||
      message?.reasoning_content ||
      data.choices?.[0]?.delta?.content ||
      data.content ||
      data.message?.content

    if (!content) {
      console.error("No content in response. Full response:", JSON.stringify(data, null, 2))
      console.error("Choices array:", data.choices)
      console.error("First choice:", data.choices?.[0])
      console.error("First choice message:", data.choices?.[0]?.message)
      console.error("Finish reason:", finishReason)
      // Try to return a helpful error response instead of throwing
      return NextResponse.json({
        terminationType: null,
        severanceAmount: null,
        noticePeriod: null,
        releaseRequired: false,
        keyTerms: [],
        detectedPhrases: [],
        error: "Unexpected response format from AI",
      })
    }

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonContent = content.trim()

    // If content came from reasoning_content, extract just the JSON part
    // Look for JSON object in the reasoning text
    if (message?.reasoning_content && !message?.content) {
      console.log("Content found in reasoning_content, extracting JSON...")

      // First, try to find a complete JSON object
      const completeJsonMatch = jsonContent.match(/\{\s*"terminationType"[\s\S]*"recommendations"[\s\S]*\]\s*\}/)
      if (completeJsonMatch) {
        jsonContent = completeJsonMatch[0]
        console.log("Found complete JSON in reasoning")
      } else {
        // Look for JSON starting point - find where the actual JSON begins
        // It usually starts after "Structure:" or similar markers, or directly with {
        const jsonStartPatterns = [
          /\{\s*"terminationType"/,  // Direct JSON start
          /Structure:\s*\n\s*\{/,     // After "Structure:"
          /\n\s*\{\s*"terminationType"/, // New line then JSON
        ]

        let jsonStartIndex = -1
        for (const pattern of jsonStartPatterns) {
          const match = jsonContent.match(pattern)
          if (match) {
            jsonStartIndex = match.index! + match[0].indexOf('{')
            break
          }
        }

        if (jsonStartIndex >= 0) {
          // Extract from JSON start to end
          jsonContent = jsonContent.substring(jsonStartIndex)

          // If JSON is incomplete (truncated), try to reconstruct from reasoning
          if (!jsonContent.trim().endsWith('}')) {
            console.log("JSON appears truncated, attempting to reconstruct from reasoning...")

            // Extract key information from reasoning text
            const terminationTypeMatch = jsonContent.match(/"terminationType"\s*:\s*"([^"]+)"/) ||
              content.match(/terminationType.*?("without-cause"|"with-cause"|"layoff")/i)
            const severanceMatch = content.match(/severance.*?\$?([\d,]+\.?\d*)/i)
            const noticeMatch = content.match(/notice.*?(\d+)\s*weeks?/i)
            const releaseMatch = content.match(/release.*?(required|true|yes|condition)/i)

            // Try to build JSON from extracted info
            const terminationType = terminationTypeMatch ? terminationTypeMatch[1] || terminationTypeMatch[2] : null
            const severanceAmount = severanceMatch ? parseFloat(severanceMatch[1].replace(/,/g, '')) : null
            const noticePeriod = noticeMatch ? `${noticeMatch[1]} weeks` : null
            const releaseRequired = releaseMatch ? true : false

            // Build complete JSON
            jsonContent = JSON.stringify({
              terminationType: terminationType || null,
              severanceAmount: severanceAmount,
              noticePeriod: noticePeriod,
              releaseRequired: releaseRequired,
              keyTerms: [],
              recommendations: []
            }, null, 2)

            console.log("Reconstructed JSON from reasoning:", jsonContent.substring(0, 200))
          }
        } else {
          // If we can't find JSON start, extract info from reasoning text and build JSON
          console.log("Could not find JSON start, extracting from reasoning text...")

          // Extract termination type from reasoning
          let terminationType = null
          if (content.match(/without-cause|without cause/i) && !content.match(/with-cause|with cause/i)) {
            terminationType = "without-cause"
          } else if (content.match(/with-cause|with cause|misconduct|for cause/i)) {
            terminationType = "with-cause"
          } else if (content.match(/layoff|position eliminated|redundancy/i)) {
            terminationType = "layoff"
          }

          // Extract severance amount (look for dollar amounts, prefer larger ones)
          let severanceAmount = null
          const severanceMatches = content.match(/\$?([\d,]+\.?\d*)/g)
          if (severanceMatches) {
            const amounts = severanceMatches.map((m: string) => parseFloat(m.replace(/[$,]/g, ''))).filter((n: number) => !isNaN(n) && n > 100)
            if (amounts.length > 0) {
              severanceAmount = Math.max(...amounts)
            }
          }

          // Extract notice period
          let noticePeriod = null
          const noticeMatch = content.match(/(\d+)\s*weeks?/i)
          if (noticeMatch) {
            noticePeriod = `${noticeMatch[1]} weeks`
          }

          // Extract release required
          const releaseRequired = /release.*?(required|true|yes|condition|signing|waiver)/i.test(content)

          // Extract key terms
          const keyTerms: string[] = []
          if (content.match(/release|waiver/i)) keyTerms.push("Release")
          if (content.match(/non-disparagement|non disparagement/i)) keyTerms.push("Non-disparagement")
          if (content.match(/severance/i)) keyTerms.push("Severance")
          if (content.match(/benefits.*continuation/i)) keyTerms.push("Benefits continuation")

          // Extract recommendations
          const recommendations: string[] = []
          if (content.match(/lawyer|legal|attorney/i)) {
            recommendations.push("Consult an employment lawyer before signing any release")
          }
          if (content.match(/benefits|expenses|accrued/i)) {
            recommendations.push("Verify all accrued benefits and expenses are properly calculated")
          }

          jsonContent = JSON.stringify({
            terminationType,
            severanceAmount,
            noticePeriod,
            releaseRequired,
            keyTerms: keyTerms.slice(0, 3),
            recommendations: recommendations.slice(0, 2)
          }, null, 2)

          console.log("Built JSON from reasoning text:", jsonContent.substring(0, 300))
        }
      }
    }

    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    }

    // Remove any leading text before the JSON object
    if (!jsonContent.trim().startsWith('{')) {
      const jsonStart = jsonContent.indexOf('{')
      if (jsonStart >= 0) {
        jsonContent = jsonContent.substring(jsonStart)
      }
    }

    // Check if response was truncated and JSON might be incomplete
    if (finishReason === 'length') {
      console.warn("Response truncated. Content length:", jsonContent.length)
      console.warn("Last 200 chars:", jsonContent.substring(Math.max(0, jsonContent.length - 200)))
    }

    let analysis
    try {
      analysis = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError)
      console.error("Content that failed to parse:", jsonContent)

      // If JSON parsing failed due to truncation, return partial results
      if (finishReason === 'length') {
        return NextResponse.json({
          terminationType: null,
          severanceAmount: null,
          noticePeriod: null,
          releaseRequired: false,
          keyTerms: [],
          detectedPhrases: [],
          error: `Response truncated - JSON incomplete. Response length: ${jsonContent.length} characters.`,
        })
      }

      throw parseError
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Document analysis error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // If it's a 401 error, provide helpful guidance
    if (errorMessage.includes("401")) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: "The API key may be invalid, expired, or not properly configured. Please check your KIMI_API_KEY in .env.local and restart the server.",
          terminationType: null,
          severanceAmount: null,
          noticePeriod: null,
          releaseRequired: false,
          keyTerms: [],
          detectedPhrases: [],
        },
        { status: 200 } // Return 200 so frontend can still display fallback
      )
    }

    return NextResponse.json(
      {
        error: "Failed to analyze document",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
