// Retirement Planning Constants

// Health to Max Age Mapping
export const MAX_AGE_MAPPING: Record<string, number> = {
    needs_improvement: 70,
    generally_healthy: 80,
    very_healthy: 90,
};

// Return Rates
export const INFLATION_RATE = 7; // 7% annual inflation
export const SIP_RETURN_RATE_SHORT_TERM = 12; // 12% for < 7 years
export const SIP_RETURN_RATE_LONG_TERM = 14; // 14% for >= 7 years
export const SIP_SHORT_TERM_THRESHOLD = 7; // Years threshold for return rate switch
export const SWP_RETURN_RATE = 10; // 10% annual returns during withdrawal phase

// Step-up and Buffer
export const SWP_STEP_UP_PERCENTAGE = 8; // 8% annual increase in withdrawal
export const LIFESTYLE_BUFFER = 0.25; // 25% buffer on monthly expenses
export const SWP_SUSTAINABILITY_BUFFER = 0.10; // 10% of initial corpus must remain
