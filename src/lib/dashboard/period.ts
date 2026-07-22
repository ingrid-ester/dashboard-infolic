import { differenceInCalendarDays, format, startOfMonth, subDays } from "date-fns";

export type Period = { from: string; to: string };

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

function startOfMonthISO() {
  return format(startOfMonth(new Date()), "yyyy-MM-dd");
}

export function resolvePeriod(searchParams: {
  from?: string;
  to?: string;
}): Period {
  return {
    from: searchParams.from ?? startOfMonthISO(),
    to: searchParams.to ?? todayISO(),
  };
}

// Immediately preceding period with the same number of days as `period`.
export function comparisonPeriod(period: Period): Period {
  const from = new Date(`${period.from}T00:00:00`);
  const to = new Date(`${period.to}T00:00:00`);
  const days = differenceInCalendarDays(to, from) + 1;

  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, days - 1);

  return { from: format(prevFrom, "yyyy-MM-dd"), to: format(prevTo, "yyyy-MM-dd") };
}

// Comparison period is either auto-computed (immediately preceding period,
// same length) or an explicit custom range chosen by the user via the URL.
export function resolveComparisonPeriod(
  period: Period,
  searchParams: { compareFrom?: string; compareTo?: string },
): Period {
  if (searchParams.compareFrom && searchParams.compareTo) {
    return { from: searchParams.compareFrom, to: searchParams.compareTo };
  }
  return comparisonPeriod(period);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
