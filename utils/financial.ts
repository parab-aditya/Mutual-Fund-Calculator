// -------------------- Date & math helpers --------------------
export const DAYS_PER_YEAR = 365.2425;

export type CashFlow = { amount: number; date: Date };

// Always anchor to UTC, first of month, to avoid DST / end-of-month drift
export function firstOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function addMonthsUTC(d: Date, m: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, 1));
}

export function daysBetweenUTC(d1: Date, d2: Date) {
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

// XNPV using year fraction on 365.2425
export function xnpv(rate: number, flows: CashFlow[]) {
  if (flows.length === 0) return 0;
  const t0 = flows[0].date;
  return flows.reduce((acc, cf) => {
    const t = daysBetweenUTC(t0, cf.date) / DAYS_PER_YEAR;
    return acc + cf.amount / Math.pow(1 + rate, t);
  }, 0);
}

// Try Newton–Raphson; may fail to converge
function xirrNewton(flows: CashFlow[], guess = 0.12, maxIter = 100, tol = 1e-7) {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    const f = xnpv(rate, flows);
    const t0 = flows[0].date;
    let df = 0;
    for (const cf of flows) {
      const t = daysBetweenUTC(t0, cf.date) / DAYS_PER_YEAR;
      df += (-t) * cf.amount / Math.pow(1 + rate, t + 1);
    }
    if (!isFinite(df) || Math.abs(df) < 1e-12) break; // derivative too small/unstable
    const newRate = rate - f / df;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return Number.NaN;
}

// Find a bracket [a,b] where f(a) and f(b) have opposite signs
function findSignChangeBracket(flows: CashFlow[]) {
  // Sample a reasonable spread of rates
  const candidates = [-0.999, -0.5, -0.2, -0.05, 0.0, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  let prevRate = candidates[0];
  let prevVal = xnpv(prevRate, flows);
  for (let i = 1; i < candidates.length; i++) {
    const r = candidates[i];
    const v = xnpv(r, flows);
    if (isFinite(prevVal) && isFinite(v) && prevVal * v < 0) {
      return { a: prevRate, b: r };
    }
    prevRate = r;
    prevVal = v;
  }
  return null;
}

// Bisection fallback (safe if function crosses zero once in bracket)
function xirrBisection(flows: CashFlow[], a: number, b: number, tol = 1e-7, maxIter = 200) {
  let fa = xnpv(a, flows);
  let fb = xnpv(b, flows);
  if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return Number.NaN;
  let left = a, right = b;
  for (let i = 0; i < maxIter; i++) {
    const mid = (left + right) / 2;
    const fm = xnpv(mid, flows);
    if (!isFinite(fm)) return Number.NaN;
    if (Math.abs(fm) < tol || Math.abs(right - left) < tol) return mid;
    if (fa * fm < 0) {
      right = mid; fb = fm;
    } else {
      left = mid; fa = fm;
    }
  }
  return (left + right) / 2;
}

// Robust XIRR: sign check + Newton, then bisection fallback if needed
export function xirr(flows: CashFlow[], guess = 0.12) {
  // Must have at least one negative and one positive cash flow
  const hasNeg = flows.some(f => f.amount < 0);
  const hasPos = flows.some(f => f.amount > 0);
  if (!hasNeg || !hasPos) return Number.NaN;

  // Try Newton first
  const nr = xirrNewton(flows, guess);
  if (isFinite(nr)) return nr;

  // Try to bracket and bisection
  const bracket = findSignChangeBracket(flows);
  if (bracket) {
    const bi = xirrBisection(flows, bracket.a, bracket.b);
    if (isFinite(bi)) return bi;
  }

  // Last resort: small expand around guess
  const eps = 0.5;
  const bi2 = xirrBisection(flows, Math.max(-0.999, guess - eps), guess + eps);
  return isFinite(bi2) ? bi2 : Number.NaN;
}

// Deflate a nominal cash flow to "today's rupees" using constant inflation (monthly)
export function deflateToBase(amount: number, monthsFromStart: number, annualInflation: number) {
  const mInfl = Math.pow(1 + annualInflation, 1 / 12) - 1;
  const factor = Math.pow(1 + mInfl, monthsFromStart);
  return amount / factor;
}

/**
 * Calculate the future value of a lumpsum investment after specified years.
 * Uses monthly compounding for consistency with SIP calculations.
 */
export function calculateLumpsumGrowth(
  principal: number,
  annualReturnRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return principal;
  const months = years * 12;
  const monthlyRate = Math.pow(1 + annualReturnRate / 100, 1 / 12) - 1;
  return principal * Math.pow(1 + monthlyRate, months);
}

/**
 * Inflate a present value to its future equivalent after specified years.
 * Inverse of deflateToBase - uses annual compounding for simplicity.
 */
export function inflateToFuture(
  presentValue: number,
  annualInflationRate: number,
  years: number
): number {
  if (years <= 0) return presentValue;
  return presentValue * Math.pow(1 + annualInflationRate / 100, years);
}
