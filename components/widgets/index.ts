/**
 * Canvas widgets (plan 014). Each is presentation-only and reads its own tool
 * hook / config; scenes arrange them. Public barrel so the paid tiers can
 * import widgets directly (ADR-0009).
 */
export { ClockWidget } from "./clock-widget";
export { WelcomeWidget } from "./welcome-widget";
export { QuoteWidget } from "./quote-widget";
export { NowPlayingWidget } from "./now-playing-widget";
export { PomodoroWidget } from "./pomodoro-widget";
export { FocusTasksWidget } from "./focus-tasks-widget";
