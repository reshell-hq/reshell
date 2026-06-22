/**
 * The optional end-of-interval chime. A short synthesized tone via the Web Audio
 * API — no asset to bundle. Ported from yeti's `chime-audio.ts`.
 *
 * ponytail: a single oscillator + gain envelope, not an audio engine. No-ops
 * outside the browser (safe to import in node tests) and swallows a blocked /
 * autoplay-suspended AudioContext rather than throwing, so a chime that the
 * browser refuses until first interaction degrades to silence.
 */
export async function playChime(): Promise<void> {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return;
  }

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
  } catch {
    // AudioContext blocked (autoplay policy) or unavailable — degrade to silence.
  }
}
