export interface ParsedStoredFile {
  name: string;
  type?: string;
  dataUrl?: string;
}

function isSerializedFile(value: string) {
  return value.trim().startsWith("{") && value.includes("\"dataUrl\"");
}

export function parseStoredFile(value?: string | null): ParsedStoredFile | null {
  if (!value) return null;

  if (!isSerializedFile(value)) {
    return { name: value };
  }

  try {
    const parsed = JSON.parse(value) as ParsedStoredFile;
    return {
      name: parsed.name,
      type: parsed.type,
      dataUrl: parsed.dataUrl,
    };
  } catch {
    return { name: value };
  }
}

export function getStoredFileName(value?: string | null, fallback = "Not added") {
  const parsed = parseStoredFile(value);
  return parsed?.name || fallback;
}

export function getStoredFileUrl(value?: string | null) {
  return parseStoredFile(value)?.dataUrl;
}

export function openStoredFile(value?: string | null) {
  const parsed = parseStoredFile(value);
  if (!parsed?.dataUrl || typeof window === "undefined") return;
  window.open(parsed.dataUrl, "_blank", "noopener,noreferrer");
}

export function downloadStoredFile(value?: string | null) {
  const parsed = parseStoredFile(value);
  if (!parsed?.dataUrl || typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = parsed.dataUrl;
  link.download = parsed.name || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function isStoredImage(value?: string | null) {
  const parsed = parseStoredFile(value);
  if (!parsed) return false;
  if (parsed.type?.startsWith("image/")) return true;
  return Boolean(parsed.dataUrl?.startsWith("data:image/"));
}

export function serializeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        JSON.stringify({
          name: file.name,
          type: file.type,
          dataUrl: typeof reader.result === "string" ? reader.result : "",
        }),
      );
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function serializeFiles(files: File[]) {
  return Promise.all(files.map((file) => serializeFile(file)));
}
