/**
 * The optional end-of-session chime (CONTEXT: "Focus split" — "optional chime on
 * session end (off by default)"). A short synthesized tone via the Web Audio
 * API; no asset to bundle. No-ops outside the browser so it is safe to import in
 * node tests.
 */
export async function playPomodoroChimeSound(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

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
}
