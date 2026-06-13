export type ClockDisplay = {
  time: string;
  date: string;
};

export type EditorialClockDisplay = {
  time: string;
  dateHero: string;
  weekday: string;
};

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export function formatEditorialClockDisplay(
  now: Date,
  locale = "en-US",
  timeZone?: string,
): EditorialClockDisplay {
  const formatOptions = timeZone ? { timeZone } : {};

  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    ...formatOptions,
  }).format(now);

  const day = Number(
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      ...formatOptions,
    }).format(now),
  );

  const monthIndex = Number(
    new Intl.DateTimeFormat(locale, {
      month: "numeric",
      ...formatOptions,
    }).format(now),
  ) - 1;

  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    ...formatOptions,
  }).format(now);

  return {
    time,
    dateHero: `${day} ${ROMAN_MONTHS[monthIndex] ?? ""}`.trim(),
    weekday,
  };
}

export function formatClockDisplay(now: Date, locale = "en-US", timeZone?: string): ClockDisplay {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(now);

  const date = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(now);

  return { time, date };
}
