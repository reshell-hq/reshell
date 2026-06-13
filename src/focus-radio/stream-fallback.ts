export const FOCUS_RADIO_STREAM_RETRY_MS = 3000;

export type FocusRadioStreamFailureAction = { type: "retry" } | { type: "failed" };

export function resolveFocusRadioStreamFailureAction(
  retriedCurrent: boolean,
): FocusRadioStreamFailureAction {
  if (!retriedCurrent) {
    return { type: "retry" };
  }

  return { type: "failed" };
}
