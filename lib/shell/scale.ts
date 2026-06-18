export type PixelSize = {
  width: number;
  height: number;
};

export type ViewBoxSize = {
  width: number;
  height: number;
};

export function pixelsToViewBoxWithScreen(
  pixels: PixelSize,
  screen: PixelSize,
  viewBox: ViewBoxSize = { width: 100, height: 100 },
): ViewBoxSize {
  if (screen.width === 0 || screen.height === 0) {
    return { width: 0, height: 0 };
  }

  return {
    width: (pixels.width / screen.width) * viewBox.width,
    height: (pixels.height / screen.height) * viewBox.height,
  };
}

export function pixelsToViewBox(
  pixels: PixelSize,
  svgElement: SVGSVGElement,
): ViewBoxSize {
  const rect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;

  return pixelsToViewBoxWithScreen(
    pixels,
    { width: rect.width, height: rect.height },
    {
      width: viewBox.width > 0 ? viewBox.width : 100,
      height: viewBox.height > 0 ? viewBox.height : 100,
    },
  );
}
