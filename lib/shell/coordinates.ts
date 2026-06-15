import type { Point } from "./types";

export function clientToViewBox(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: clientX, y: clientY };
  }

  const transformed = point.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}
