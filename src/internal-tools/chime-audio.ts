type RestorePlayback = () => void;

let duckPlayback: (() => RestorePlayback) | null = null;

export function registerChimePlaybackDucker(duck: () => RestorePlayback): void {
  duckPlayback = duck;
}

export function unregisterChimePlaybackDucker(): void {
  duckPlayback = null;
}

export async function playPomodoroChimeSound(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const restore = duckPlayback?.();

  try {
    const context = new AudioContext();
    await context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.35);
    gain.gain.setValueAtTime(0.35, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.55);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.55);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 580);
    });

    await context.close();
  } finally {
    restore?.();
  }
}
