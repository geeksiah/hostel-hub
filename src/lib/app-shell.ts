import type { User } from "@/types";

export function shouldUseAccountShell(user?: User | null) {
  return user?.role === "resident" || user?.role === "group_organizer";
}

export function getBrowsePath(user: User | null | undefined, buildPublicPath: (path?: string) => string) {
  if (user?.role === "resident") return "/resident/properties";
  if (user?.role === "group_organizer") return "/group/properties";
  return buildPublicPath("/properties");
}

export function getPropertyPath(
  user: User | null | undefined,
  hostelId: string,
  buildPublicPath: (path?: string) => string,
) {
  if (user?.role === "resident") return `/resident/properties/${hostelId}`;
  if (user?.role === "group_organizer") return `/group/properties/${hostelId}`;
  return buildPublicPath(`/properties/${hostelId}`);
}

export function getRoomPath(
  user: User | null | undefined,
  roomId: string,
  buildPublicPath: (path?: string) => string,
) {
  if (user?.role === "resident") return `/resident/rooms/${roomId}`;
  if (user?.role === "group_organizer") return `/group/rooms/${roomId}`;
  return buildPublicPath(`/rooms/${roomId}`);
}

export function getAppHomePath(user?: User | null) {
  if (user?.role === "tenant_admin") return "/admin";
  if (user?.role === "platform_owner") return "/platform";
  if (user?.role === "group_organizer") return "/group-booking";
  return "/resident";
}
