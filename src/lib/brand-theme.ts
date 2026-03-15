import type { CSSProperties } from "react";
import type { BrandTheme, BrandThemeOverride } from "@/types";

function normalizeHex(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const next = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(next) ? next : fallback;
}

function expandHex(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return clean
      .split("")
      .map((value) => value + value)
      .join("");
  }
  return clean;
}

function hexToRgb(hex: string) {
  const clean = expandHex(normalizeHex(hex, "#000000"));
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHslChannels(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case r:
        hue = ((g - b) / delta) % 6;
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  return `${hue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function hexToHslChannels(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHslChannels(r, g, b);
}

function setHexLightness(hex: string, lightness: number) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * ((max + min) / 2) - 1));
    if (max === r / 255) hue = (((g / 255) - (b / 255)) / delta) % 6;
    else if (max === g / 255) hue = (b / 255 - r / 255) / delta + 2;
    else hue = (r / 255 - g / 255) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return `${hue} ${Math.round(saturation * 100)}% ${lightness}%`;
}

function readableText(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#0F1720" : "#FFFFFF";
}

export function mergeBrandTheme(theme: BrandTheme, override?: BrandThemeOverride) {
  return {
    ...theme,
    ...(override ?? {}),
  };
}

export function createBrandThemeStyle(theme: BrandTheme): CSSProperties {
  const primaryForeground = readableText(theme.primaryColor);
  const secondaryForeground = readableText(theme.secondaryColor);
  const accentForeground = readableText(theme.accentColor);
  const sidebarAccent = setHexLightness(theme.sidebarBackgroundColor, 18);

  return {
    "--font-display": theme.fontDisplay,
    "--font-body": theme.fontBody,
    "--background": hexToHslChannels(theme.backgroundColor),
    "--foreground": hexToHslChannels(theme.foregroundColor),
    "--card": hexToHslChannels(theme.cardColor),
    "--card-foreground": hexToHslChannels(theme.cardForegroundColor),
    "--popover": hexToHslChannels(theme.cardColor),
    "--popover-foreground": hexToHslChannels(theme.cardForegroundColor),
    "--primary": hexToHslChannels(theme.primaryColor),
    "--primary-foreground": hexToHslChannels(primaryForeground),
    "--secondary": hexToHslChannels(theme.secondaryColor),
    "--secondary-foreground": hexToHslChannels(secondaryForeground),
    "--muted": hexToHslChannels(theme.mutedColor),
    "--muted-foreground": hexToHslChannels(theme.mutedForegroundColor),
    "--accent": hexToHslChannels(theme.accentColor),
    "--accent-foreground": hexToHslChannels(accentForeground),
    "--border": hexToHslChannels(theme.borderColor),
    "--input": hexToHslChannels(theme.borderColor),
    "--ring": hexToHslChannels(theme.secondaryColor),
    "--emerald": hexToHslChannels(theme.secondaryColor),
    "--emerald-light": setHexLightness(theme.secondaryColor, 94),
    "--amber": hexToHslChannels(theme.accentColor),
    "--amber-light": setHexLightness(theme.accentColor, 94),
    "--navy": hexToHslChannels(theme.primaryColor),
    "--navy-light": setHexLightness(theme.primaryColor, 22),
    "--sidebar-background": hexToHslChannels(theme.sidebarBackgroundColor),
    "--sidebar-foreground": hexToHslChannels(theme.sidebarForegroundColor),
    "--sidebar-primary": hexToHslChannels(theme.secondaryColor),
    "--sidebar-primary-foreground": hexToHslChannels(secondaryForeground),
    "--sidebar-accent": sidebarAccent,
    "--sidebar-accent-foreground": hexToHslChannels(theme.sidebarForegroundColor),
    "--sidebar-border": hexToHslChannels(theme.borderColor),
    "--sidebar-ring": hexToHslChannels(theme.secondaryColor),
    "--brand-hero-from": theme.heroFromColor,
    "--brand-hero-to": theme.heroToColor,
  } as CSSProperties;
}
