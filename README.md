# Canadian Severance Pay Calculator

A comprehensive severance pay calculator for all Canadian provinces and territories, based on common law reasonable notice principles.

## Features

- **Multi-Province Support**: Calculate severance for all Canadian provinces and territories
- **Common Law Calculations**: Estimates based on age, position, years of service, and other factors
- **Statutory Minimums**: Shows minimum entitlements under employment standards legislation
- **Offer Comparison**: Compare employer offers against recommended severance amounts
- **Lawyer Pricing**: Displays estimated legal consultation costs by province
- **Modern UI**: Built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

The calculator considers:

- **Province/Territory**: Different jurisdictions have varying statutory requirements
- **Years of Service**: Length of employment affects entitlements
- **Age**: Older employees typically receive longer notice periods
- **Job Position**: Management and professional roles often receive higher severance
- **Annual Salary**: Used to calculate dollar amounts
- **Union Status**: Unionized employees are covered by collective agreements
- **Current Offer**: Compare employer offers against recommended amounts

## Calculation Methodology

### Statutory Minimums
Each province has minimum notice periods required by employment standards legislation (typically 1 week per year of service, capped at 4-8 weeks depending on province).

### Common Law Reasonable Notice
Based on established Canadian case law, reasonable notice considers:
- Age multipliers (higher for older employees)
- Position multipliers (higher for management roles)
- Years of service (typically 1-2 months per year)
- Range: 2-24 months depending on circumstances

### Ontario ESA Severance
Ontario has additional statutory severance pay requirements for employees of employers with payroll ≥ $2.5M (1 week per year, max 26 weeks).

## Important Disclaimer

**This calculator provides estimates only and does not constitute legal advice.** Actual severance entitlements depend on many factors including:
- Employment contracts
- Industry standards
- Specific circumstances
- Court precedents

It is strongly recommended that you consult with an employment lawyer for advice tailored to your situation.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI / Radix UI
- **State Management**: React hooks

## Project Structure

```
severance/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── severance-calculator.tsx  # Main calculator component
│   └── calculator-results.tsx    # Results display component
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── calculations.ts     # Severance calculation logic
│   ├── lawyer-pricing.ts  # Lawyer pricing data
│   └── utils.ts            # Utility functions
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

The project includes a `vercel.json` configuration file for optimal deployment.

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build preset
- **Railway**: Automatic Next.js detection
- **AWS Amplify**: Configure build settings for Next.js
- **Docker**: Use `next build` and `next start` commands

### Build Commands

```bash
# Production build
npm run build

# Start production server
npm start

# Development server
npm run dev
```

### Environment Variables

No environment variables are required for basic functionality. All calculations are performed client-side.

## License

This project is for educational and informational purposes only.
