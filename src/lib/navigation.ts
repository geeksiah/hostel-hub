export function isAppRouteActive(path: string, pathname: string) {
  if (path === "/resident" || path === "/group-booking") {
    return pathname === path;
  }

  if (path.includes("/properties")) {
    return pathname.includes("/properties") || pathname.includes("/rooms/");
  }

  if (path === "/payment") {
    return pathname.startsWith("/payment");
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}
