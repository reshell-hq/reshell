export function formatWelcomeMessage(now: Date, displayName?: string | null, timeZone?: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      ...(timeZone ? { timeZone } : {}),
    }).format(now),
  );

  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = displayName?.trim();

  return name ? `${greeting}, ${name}` : greeting;
}
