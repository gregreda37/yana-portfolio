const MONTH_MAP = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
  january:0, february:1, march:2, april:3, june:5, july:6, august:7,
  september:8, october:9, november:10, december:11,
};

function periodEndMs(period) {
  if (!period) return 0;
  const s = period.toLowerCase().trim();

  if (/present|current|now/.test(s)) return 99999999999999;

  // Take the part after the separator (–, —, or -)
  const parts = s.split(/\s*[–—\-]\s*/);
  const end = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();

  // "June 2024" or "Jun 2024" or "Jun. 2024"
  const monthYear = end.match(/([a-z]+)\.?\s+(\d{4})/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1].slice(0, 3)];
    const year = parseInt(monthYear[2], 10);
    if (month !== undefined && !isNaN(year)) return new Date(year, month).getTime();
  }

  // "2024" alone
  const yearOnly = end.match(/\b(\d{4})\b/);
  if (yearOnly) return new Date(parseInt(yearOnly[1], 10), 11, 31).getTime();

  return 0;
}

export function sortJobsByDate(jobs) {
  return [...(jobs ?? [])].sort((a, b) => periodEndMs(b.period) - periodEndMs(a.period));
}
