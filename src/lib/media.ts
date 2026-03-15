import roomDouble from "@/assets/room-double.jpg";
import roomSingle from "@/assets/room-single.jpg";
import { getStoredFileUrl } from "@/lib/files";

const seededImages: Record<string, string> = {
  "room-single": roomSingle,
  "room-double": roomDouble,
  "dreamland-1": roomSingle,
  "dreamland-2": roomDouble,
  "annex-1": roomDouble,
  "annex-2": roomSingle,
  "greenview-1": roomSingle,
  "greenview-2": roomDouble,
};

export function resolveImageSource(value?: string | null, fallback = roomSingle) {
  if (!value) return fallback;
  const storedUrl = getStoredFileUrl(value);
  if (storedUrl) return storedUrl;
  if (value.startsWith("data:")) return value;
  return seededImages[value] ?? fallback;
}

export function resolveRoomGallery(images: string[] = []) {
  const resolved = images.length
    ? images.map((image, index) => resolveImageSource(image, index % 2 === 0 ? roomSingle : roomDouble))
    : [roomSingle, roomDouble];

  if (resolved.length === 1) {
    resolved.push(resolved[0] === roomSingle ? roomDouble : roomSingle);
  }

  return resolved;
}
