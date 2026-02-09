import type { LawyerPricing, Province } from "./types"

export const lawyerPricingByProvince: Record<Province, LawyerPricing> = {
  ON: {
    province: "ON",
    consultationFee: {
      min: 200,
      max: 500,
      average: 350,
    },
    hourlyRate: {
      min: 300,
      max: 600,
      average: 450,
    },
    flatFeeRange: {
      min: 2000,
      max: 5000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  BC: {
    province: "BC",
    consultationFee: {
      min: 200,
      max: 500,
      average: 350,
    },
    hourlyRate: {
      min: 300,
      max: 600,
      average: 450,
    },
    flatFeeRange: {
      min: 2000,
      max: 5000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  AB: {
    province: "AB",
    consultationFee: {
      min: 200,
      max: 450,
      average: 325,
    },
    hourlyRate: {
      min: 275,
      max: 550,
      average: 400,
    },
    flatFeeRange: {
      min: 1800,
      max: 4500,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  SK: {
    province: "SK",
    consultationFee: {
      min: 150,
      max: 400,
      average: 275,
    },
    hourlyRate: {
      min: 250,
      max: 500,
      average: 375,
    },
    flatFeeRange: {
      min: 1500,
      max: 4000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  MB: {
    province: "MB",
    consultationFee: {
      min: 150,
      max: 400,
      average: 275,
    },
    hourlyRate: {
      min: 250,
      max: 500,
      average: 375,
    },
    flatFeeRange: {
      min: 1500,
      max: 4000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  NS: {
    province: "NS",
    consultationFee: {
      min: 150,
      max: 400,
      average: 275,
    },
    hourlyRate: {
      min: 250,
      max: 500,
      average: 375,
    },
    flatFeeRange: {
      min: 1500,
      max: 4000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  NB: {
    province: "NB",
    consultationFee: {
      min: 150,
      max: 400,
      average: 275,
    },
    hourlyRate: {
      min: 250,
      max: 500,
      average: 375,
    },
    flatFeeRange: {
      min: 1500,
      max: 4000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  NL: {
    province: "NL",
    consultationFee: {
      min: 150,
      max: 400,
      average: 275,
    },
    hourlyRate: {
      min: 250,
      max: 500,
      average: 375,
    },
    flatFeeRange: {
      min: 1500,
      max: 4000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  PE: {
    province: "PE",
    consultationFee: {
      min: 150,
      max: 350,
      average: 250,
    },
    hourlyRate: {
      min: 225,
      max: 450,
      average: 350,
    },
    flatFeeRange: {
      min: 1200,
      max: 3500,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  NT: {
    province: "NT",
    consultationFee: {
      min: 200,
      max: 450,
      average: 325,
    },
    hourlyRate: {
      min: 275,
      max: 550,
      average: 400,
    },
    flatFeeRange: {
      min: 1800,
      max: 4500,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  YT: {
    province: "YT",
    consultationFee: {
      min: 200,
      max: 450,
      average: 325,
    },
    hourlyRate: {
      min: 275,
      max: 550,
      average: 400,
    },
    flatFeeRange: {
      min: 1800,
      max: 4500,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  NU: {
    province: "NU",
    consultationFee: {
      min: 200,
      max: 450,
      average: 325,
    },
    hourlyRate: {
      min: 275,
      max: 550,
      average: 400,
    },
    flatFeeRange: {
      min: 1800,
      max: 4500,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  QC: {
    province: "QC",
    consultationFee: {
      min: 200,
      max: 500,
      average: 350,
    },
    hourlyRate: {
      min: 300,
      max: 600,
      average: 450,
    },
    flatFeeRange: {
      min: 2000,
      max: 5000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
  Federal: {
    province: "Federal",
    consultationFee: {
      min: 200,
      max: 500,
      average: 350,
    },
    hourlyRate: {
      min: 300,
      max: 600,
      average: 450,
    },
    flatFeeRange: {
      min: 2000,
      max: 5000,
    },
    contingencyFee: {
      percentage: 25,
    },
  },
}
