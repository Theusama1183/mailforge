export type PlanCode = "free" | "pro" | "business" | "enterprise"

export interface Plan {
  code: PlanCode
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: {
    emailsPerDay: number
    emailsPerHour: number
    storageMb: number
    apiRequestsPerMinute: number
    domainsAllowed: number
    teamMembers: number
    customTemplates: boolean
    abTesting: boolean
    imapSync: boolean
    prioritySupport: boolean
  }
}

export const PLANS: Record<PlanCode, Plan> = {
  free: {
    code: "free",
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      emailsPerDay: 100,
      emailsPerHour: 10,
      storageMb: 500,
      apiRequestsPerMinute: 60,
      domainsAllowed: 1,
      teamMembers: 1,
      customTemplates: false,
      abTesting: false,
      imapSync: false,
      prioritySupport: false,
    },
  },
  pro: {
    code: "pro",
    name: "Pro",
    description: "For professionals and small teams",
    priceMonthly: 1999,
    priceYearly: 19990,
    features: {
      emailsPerDay: 10000,
      emailsPerHour: 500,
      storageMb: 5120,
      apiRequestsPerMinute: 300,
      domainsAllowed: 5,
      teamMembers: 5,
      customTemplates: true,
      abTesting: true,
      imapSync: true,
      prioritySupport: false,
    },
  },
  business: {
    code: "business",
    name: "Business",
    description: "For growing businesses",
    priceMonthly: 4999,
    priceYearly: 49990,
    features: {
      emailsPerDay: 50000,
      emailsPerHour: 2000,
      storageMb: 20480,
      apiRequestsPerMinute: 1000,
      domainsAllowed: 25,
      teamMembers: 25,
      customTemplates: true,
      abTesting: true,
      imapSync: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    code: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      emailsPerDay: 999999,
      emailsPerHour: 50000,
      storageMb: 102400,
      apiRequestsPerMinute: 5000,
      domainsAllowed: 999,
      teamMembers: 999,
      customTemplates: true,
      abTesting: true,
      imapSync: true,
      prioritySupport: true,
    },
  },
}

export function getPlan(code: PlanCode): Plan {
  return PLANS[code]
}

export function getTrialDays(): number {
  return 14
}
