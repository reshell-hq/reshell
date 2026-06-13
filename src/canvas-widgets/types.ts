export type CanvasWidgetId =
  | "clock"
  | "welcome"
  | "quote"
  | "nowPlaying"
  | "pomodoro"
  | "focusTasks";

export type CanvasWidgetConfig = Record<CanvasWidgetId, boolean>;
