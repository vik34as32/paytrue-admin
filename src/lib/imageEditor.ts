function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export image"));
      },
      mimeType,
      quality
    );
  });
}

export function renderImageToCanvas(
  image: HTMLImageElement,
  rotation: number,
  scale: number
): HTMLCanvasElement {
  const radians = (rotation * Math.PI) / 180;
  const baseWidth = image.naturalWidth;
  const baseHeight = image.naturalHeight;
  const isVertical = rotation % 180 !== 0;
  const rotatedWidth = isVertical ? baseHeight : baseWidth;
  const rotatedHeight = isVertical ? baseWidth : baseHeight;
  const finalWidth = Math.max(1, Math.round(rotatedWidth * scale));
  const finalHeight = Math.max(1, Math.round(rotatedHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, finalWidth, finalHeight);
  context.translate(finalWidth / 2, finalHeight / 2);
  context.rotate(radians);
  context.scale(scale, scale);
  context.drawImage(image, -baseWidth / 2, -baseHeight / 2);

  return canvas;
}

export async function createEditedImageFile(
  src: string,
  rotation: number,
  scale: number,
  fileName: string,
  mimeType = "image/jpeg"
): Promise<File> {
  const image = await loadImage(src);
  const canvas = renderImageToCanvas(image, rotation, scale);
  const blob = await canvasToBlob(canvas, mimeType);
  return new File([blob], fileName, { type: mimeType });
}

export function getEditedImageMimeType(fileName?: string, fallback = "image/jpeg") {
  if (!fileName) return fallback;
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return fallback;
}
