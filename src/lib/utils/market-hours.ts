/**
 * Indian equity market hours and NAV publication logic.
 *
 * Market hours: Mon–Fri 9:15 AM – 3:30 PM IST
 * NAV publication: typically by 9–10 PM IST after market close
 *
 * We define an "active window" (9 AM – 11 PM IST, weekdays) during which
 * we revalidate hourly so new NAVs are picked up promptly once published.
 * Outside this window (nights + weekends), we revalidate daily.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function getIST(now = new Date()): { hour: number; day: number } {
  const istMs = now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(istMs);
  return { hour: ist.getHours(), day: ist.getDay() };
}

/** True during weekday active window (9 AM – 11 PM IST) */
export function isMarketActive(now = new Date()): boolean {
  const { hour, day } = getIST(now);
  const isWeekday = day >= 1 && day <= 5;
  const inActiveWindow = hour >= 9 && hour < 23;
  return isWeekday && inActiveWindow;
}

/** Returns revalidation seconds: 3600 (1h) during active window, 86400 (24h) otherwise */
export function getNavRevalidate(now = new Date()): number {
  return isMarketActive(now) ? 3600 : 86400;
}
