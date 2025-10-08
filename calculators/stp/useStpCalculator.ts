import { useMemo } from 'react';
import { StpInputs, StpResults, TransferFrequency, StpGrowthData } from './types';

/**
 * Assumptions implemented:
 * - Compounding: Date-based accrual using Actual/365.
 *   Growth factor over Δdays = (1 + AnnualRate)^(Δdays / 365).
 * - Transfer timing: END of each period (grow first, then transfer).
 * - Frequency options preserved, but definitions are date-accurate:
 *     Weekly: every 7 days
 *     15-days: every 15 days (rolling)
 *     Monthly: add 1 calendar month per event (date-aware)
 *     Quarterly: add 3 calendar months per event (date-aware)
 *     Yearly: add 1 calendar year per event (date-aware)
 * - Period handling: date-based; we generate a schedule of transfer dates from startDate
 *   until (and possibly on) endDate = startDate + timePeriod years. Final partial accrual
 *   is applied from last transfer date to endDate with no transfer.
 */

const EMPTY_RESULTS: StpResults = {
  investedAmount: 0,
  sourceFundValue: 0,
  destinationFundValue: 0,
  totalValue: 0,
};

type LocalInputs = StpInputs & {
  /** Optional: deterministic start date. Defaults to today’s date if not provided. */
  startDate?: Date;
};

/** Add calendar months in a date-aware way, preserving end-of-month intent. */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // If original day overflowed (e.g., adding 1 month from Jan 31 → March 3),
  // adjust to last day of the new month.
  if (d.getDate() < day) {
    // Set to last day of previous month by setting date 0 of next month.
    d.setDate(0);
  }
  return d;
}

/** Add years in a date-aware way (handles leap years). */
function addYears(date: Date, years: number): Date {
  const d = new Date(date.getTime());
  const month = d.getMonth();
  const day = d.getDate();
  d.setFullYear(d.getFullYear() + years);

  // If Feb 29 overflow, adjust to last day of Feb
  if (month === 1 && day === 29 && d.getMonth() !== 1) {
    d.setMonth(1, 28);
  }
  return d;
}

/** Days between dates using UTC, ignoring time-of-day. */
function daysBetweenUTC(a: Date, b: Date): number {
  const AU = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const BU = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((BU - AU) / MS_PER_DAY));
}

/** Build transfer schedule dates from start (exclusive) until end (inclusive when aligned). */
function buildTransferSchedule(start: Date, end: Date, freq: TransferFrequency): Date[] {
  const dates: Date[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate()); // normalize

  const pushIfBeforeOrEqual = (d: Date) => {
    if (d <= end) dates.push(d);
  };

  switch (freq) {
    case 'Weekly': {
      while (true) {
        cursor = new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7));
        // Convert back to local date (but we only use Y-M-D)
        const local = new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate());
        if (local > end) break;
        pushIfBeforeOrEqual(local);
      }
      break;
    }
    case '15-days': {
      while (true) {
        cursor = new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 15));
        const local = new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate());
        if (local > end) break;
        pushIfBeforeOrEqual(local);
      }
      break;
    }
    case 'Monthly': {
      while (true) {
        cursor = addMonths(cursor, 1);
        if (cursor > end) break;
        pushIfBeforeOrEqual(cursor);
      }
      break;
    }
    case 'Quarterly': {
      while (true) {
        cursor = addMonths(cursor, 3);
        if (cursor > end) break;
        pushIfBeforeOrEqual(cursor);
      }
      break;
    }
    case 'Yearly': {
      while (true) {
        cursor = addYears(cursor, 1);
        if (cursor > end) break;
        pushIfBeforeOrEqual(cursor);
      }
      break;
    }
    default: {
      // Fallback to Monthly if unknown (keeps backward compatibility).
      while (true) {
        cursor = addMonths(cursor, 1);
        if (cursor > end) break;
        pushIfBeforeOrEqual(cursor);
      }
    }
  }

  return dates;
}

/** Apply Actual/365 compounding for Δdays at annual rate r (e.g., 0.065 for 6.5%). */
function growByDays(balance: number, annualRate: number, deltaDays: number): number {
  if (balance <= 0 || annualRate === 0 || deltaDays <= 0) return balance;
  const factor = Math.pow(1 + annualRate, deltaDays / 365);
  return balance * factor;
}

export const useStpCalculator = (inputs: LocalInputs) => {
  const {
    investmentAmount,
    sourceReturnRate,
    transferAmount,
    transferFrequency,
    timePeriod, // in years (can be fractional)
    destinationReturnRate,
    startDate,
  } = inputs;

  const { results, growthData } = useMemo<{ results: StpResults; growthData: StpGrowthData[] }>(() => {
    if (investmentAmount <= 0 || timePeriod <= 0 || transferAmount <= 0) {
      return { 
        results: { ...EMPTY_RESULTS, investedAmount: investmentAmount },
        growthData: []
      };
    }

    // Establish start and end dates based on timePeriod (years, may be fractional).
    const start = startDate ? new Date(startDate) : new Date();
    const wholeYears = Math.trunc(timePeriod);
    const fractionalYears = timePeriod - wholeYears;
    const endWhole = addYears(new Date(start), wholeYears);
    const extraDays = Math.round(fractionalYears * 365);
    const end = new Date(endWhole.getFullYear(), endWhole.getMonth(), endWhole.getDate() + extraDays);

    const schedule = buildTransferSchedule(start, end, transferFrequency);
    const scheduleTimeSet = new Set(schedule.map(d => d.getTime()));

    const yearEndDates = [];
    for (let y = 1; y <= Math.floor(timePeriod); y++) {
        const yearEndDate = addYears(new Date(start), y);
        if (yearEndDate <= end) {
            yearEndDates.push(yearEndDate);
        }
    }
    const yearEndTimeSet = new Set(yearEndDates.map(d => d.getTime()));
    
    // Combine and sort all event dates (transfers + year ends for chart)
    const allEventDates = [...new Set([...schedule, ...yearEndDates].map(d => d.getTime()))]
        .map(t => new Date(t))
        .sort((a, b) => a.getTime() - b.getTime());

    const srcAnnual = sourceReturnRate / 100;
    const dstAnnual = destinationReturnRate / 100;

    let sourceBalance = investmentAmount;
    let destBalance = 0;
    let prevDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const yearlyData: StpGrowthData[] = [];
    let yearCounter = 1;

    for (const eventDate of allEventDates) {
      const deltaDays = daysBetweenUTC(prevDate, eventDate);
      if (deltaDays > 0) {
        sourceBalance = growByDays(sourceBalance, srcAnnual, deltaDays);
        destBalance = growByDays(destBalance, dstAnnual, deltaDays);
      }

      if (scheduleTimeSet.has(eventDate.getTime())) {
        if (sourceBalance > 0 && transferAmount > 0) {
          const actualTransfer = Math.min(transferAmount, sourceBalance);
          sourceBalance -= actualTransfer;
          destBalance += actualTransfer;
        }
      }
      
      if (yearEndTimeSet.has(eventDate.getTime())) {
        yearlyData.push({
            year: yearCounter++,
            sourceFundValue: Math.round(sourceBalance),
            destinationFundValue: Math.round(destBalance),
            totalValue: Math.round(sourceBalance + destBalance),
        });
      }

      prevDate = eventDate;
    }

    // Final accrual from last event to end date (no transfer at the horizon)
    const tailDays = daysBetweenUTC(prevDate, end);
    if (tailDays > 0) {
      sourceBalance = growByDays(sourceBalance, srcAnnual, tailDays);
      destBalance = growByDays(destBalance, dstAnnual, tailDays);
    }

    // Guard against negative float artifacts
    sourceBalance = Math.max(0, sourceBalance);
    destBalance = Math.max(0, destBalance);

    const finalResults = {
      investedAmount: investmentAmount,
      sourceFundValue: Math.round(sourceBalance),
      destinationFundValue: Math.round(destBalance),
      totalValue: Math.round(sourceBalance + destBalance),
    };

    return { results: finalResults, growthData: yearlyData };
  }, [
    investmentAmount,
    sourceReturnRate,
    transferAmount,
    transferFrequency,
    timePeriod,
    destinationReturnRate,
    startDate,
  ]);

  return { results, growthData };
};
