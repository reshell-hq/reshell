"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 2;

type CanvasNowPlayingVisualizerProps = {
  active: boolean;
  getAnalyser?: () => AnalyserNode | null;
};

export function CanvasNowPlayingVisualizer({
  active,
  getAnalyser,
}: CanvasNowPlayingVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const getAnalyserRef = useRef(getAnalyser);
  const smoothedLevelsRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 0));

  getAnalyserRef.current = getAnalyser;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationId = 0;
    let frequencyData: Uint8Array<ArrayBuffer> | null = null;
    const smoothed = smoothedLevelsRef.current;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        animationId = window.requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      context.clearRect(0, 0, width, height);

      const barColor = getComputedStyle(canvas).color;
      const fill = withAlpha(barColor, 0.14);
      const peakFill = withAlpha(barColor, 0.28);

      const analyser = getAnalyserRef.current?.() ?? null;
      if (analyser) {
        if (analyser.context instanceof AudioContext && analyser.context.state === "suspended") {
          void analyser.context.resume();
        }

        if (!frequencyData || frequencyData.length !== analyser.frequencyBinCount) {
          frequencyData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(frequencyData);

        for (let index = 0; index < BAR_COUNT; index++) {
          const target = readBarLevel(index, frequencyData);
          const previous = smoothed[index] ?? 0;
          smoothed[index] = previous * 0.35 + target * 0.65;
        }
      } else {
        for (let index = 0; index < BAR_COUNT; index++) {
          smoothed[index] = (smoothed[index] ?? 0) * 0.8;
        }
      }

      const gap = 1;
      const barWidth = Math.max(1, (width - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      const centerIndex = (BAR_COUNT - 1) / 2;

      for (let index = 0; index < BAR_COUNT; index++) {
        const centerDistance = Math.abs(index - centerIndex) / centerIndex;
        const envelope = 1 - centerDistance * 0.18;
        const level = (smoothed[index] ?? 0) * envelope;
        const barHeight = Math.max(MIN_BAR_HEIGHT, height * level);
        const x = index * (barWidth + gap);
        const gradient = context.createLinearGradient(0, 0, 0, barHeight);
        gradient.addColorStop(0, peakFill);
        gradient.addColorStop(0.45, fill);
        gradient.addColorStop(1, withAlpha(barColor, 0));
        context.fillStyle = gradient;
        context.beginPath();
        context.roundRect(x, 0, barWidth, barHeight, 1);
        context.fill();
      }

      animationId = window.requestAnimationFrame(draw);
    };

    animationId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animationId);
  }, [active]);

  return <canvas ref={canvasRef} className="canvas-now-playing-visualizer" aria-hidden />;
}

function readBarLevel(barIndex: number, frequencyData: Uint8Array): number {
  const binCount = frequencyData.length;
  const usableBins = Math.max(8, Math.floor(binCount * 0.72));
  const startRatio = barIndex / BAR_COUNT;
  const endRatio = (barIndex + 1) / BAR_COUNT;
  const startBin = Math.floor(Math.pow(startRatio, 1.35) * usableBins);
  const endBin = Math.max(startBin + 1, Math.floor(Math.pow(endRatio, 1.35) * usableBins));

  let peak = 0;
  for (let bin = startBin; bin < endBin && bin < binCount; bin++) {
    peak = Math.max(peak, frequencyData[bin] ?? 0);
  }

  const normalized = peak / 255;
  return Math.min(1, normalized * 2.4);
}

function withAlpha(color: string, alpha: number): string {
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }

  if (color.startsWith("#") && color.length === 7) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}
