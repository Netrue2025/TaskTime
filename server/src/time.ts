export type Period = "daily" | "weekly" | "monthly";

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function zonedParts(date: Date, timezone: string): Parts {
  const entries = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).map(x => [x.type, x.value]);
  const parts = Object.fromEntries(entries) as Record<string, string>;
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute, second: +parts.second };
}

export function fromZonedParts(parts: Omit<Parts, "hour" | "minute" | "second"> & Partial<Pick<Parts, "hour" | "minute" | "second">>, timezone: string) {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour || 0, parts.minute || 0, parts.second || 0);
  let candidate = new Date(desired);
  for (let i = 0; i < 2; i++) {
    const actual = zonedParts(candidate, timezone);
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

export function shiftLocal(parts: Parts, days: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: 0, minute: 0, second: 0 };
}

export function getPeriodBounds(period: Period, timezone: string, reference = new Date()) {
  const local = zonedParts(reference, timezone);
  const pseudo = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const mondayOffset = (pseudo.getUTCDay() + 6) % 7;
  const startParts = period === "daily" ? shiftLocal(local, 0) : period === "weekly" ? shiftLocal(local, -mondayOffset) : { ...local, day: 1, hour: 0, minute: 0, second: 0 };
  const nextPseudo = period === "daily" ? new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day + 1)) : period === "weekly" ? new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day + 7)) : new Date(Date.UTC(startParts.year, startParts.month, 1));
  const nextParts = { year: nextPseudo.getUTCFullYear(), month: nextPseudo.getUTCMonth() + 1, day: nextPseudo.getUTCDate(), hour: 0, minute: 0, second: 0 };
  return { start: fromZonedParts(startParts, timezone), end: new Date(fromZonedParts(nextParts, timezone).getTime() - 1), startParts };
}
