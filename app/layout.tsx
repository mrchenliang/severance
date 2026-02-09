import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Canadian Severance Pay Calculator",
  description: "Calculate your severance pay entitlements across all Canadian provinces based on common law",
  keywords: ["severance pay", "canada", "employment law", "termination", "severance calculator", "common law"],
  authors: [{ name: "Severance Calculator" }],
  openGraph: {
    title: "Canadian Severance Pay Calculator",
    description: "Calculate your severance pay entitlements across all Canadian provinces based on common law",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
