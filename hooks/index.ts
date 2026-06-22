/**
 * Public hooks barrel (ADR-0009). These are the supported React seams a
 * consumer composes the paid tiers from: the provider plus the four tool/clock
 * hooks. Internal hooks (`useShellAnimation`, `useGlobalTypeahead`) are shell /
 * command-bar machinery and stay importable only by path.
 */
export {
  ReshellProvider,
  useReshellState,
  type ReshellState,
} from "./use-reshell-state";
export { useTimer, type UseTimer } from "./use-timer";
export { useTasks, type UseTasks } from "./use-tasks";
export { useMusic, type UseMusic } from "./use-music";
export { useClock, type ClockOptions } from "./use-clock";
