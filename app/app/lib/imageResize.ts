export function resizePlan(w: number, h: number, max = 1600): { w: number; h: number } | null {
  const longSide = Math.max(w, h);
  if (longSide <= max) return null;
  const scale = max / longSide;
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

export async function resizeImageFile(file: File, max = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const plan = resizePlan(bitmap.width, bitmap.height, max);
  if (!plan) { bitmap.close?.(); return file; }
  const canvas = document.createElement("canvas");
  canvas.width = plan.w; canvas.height = plan.h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, plan.w, plan.h);
  bitmap.close?.();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), type, 0.85));
  const name = file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".jpg");
  return new File([blob], name, { type });
}
