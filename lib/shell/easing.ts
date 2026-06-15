export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function isSettled(
  current: number,
  target: number,
  threshold: number,
): boolean {
  return Math.abs(current - target) < threshold;
}
