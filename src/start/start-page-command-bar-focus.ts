const START_PAGE_FOCUS_RETRY_DELAYS_MS = [0, 50, 150, 300] as const;

export function shouldFocusStartPageCommandBar(activeElement: Element | null): boolean {
  if (!activeElement) {
    return true;
  }
  if (activeElement === document.body || activeElement === document.documentElement) {
    return true;
  }
  return activeElement instanceof HTMLInputElement && activeElement.type === "search";
}

export function focusStartPageCommandBar(input: HTMLInputElement | null): void {
  if (!input) {
    return;
  }
  input.focus({ preventScroll: true });
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

export function scheduleStartPageCommandBarFocus(
  input: HTMLInputElement | null,
  schedule: (callback: () => void, delayMs: number) => number = (callback, delayMs) =>
    window.setTimeout(callback, delayMs),
): () => void {
  const timeouts: number[] = START_PAGE_FOCUS_RETRY_DELAYS_MS.map((delayMs) =>
    schedule(() => {
      if (shouldFocusStartPageCommandBar(document.activeElement)) {
        focusStartPageCommandBar(input);
      }
    }, delayMs),
  );

  return () => {
    for (const timeout of timeouts) {
      clearTimeout(timeout);
    }
  };
}
