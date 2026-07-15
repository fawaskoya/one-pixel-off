import type {
  GlyphFamilyId,
  PaletteId,
  VectorPrimitive,
} from "./types";

export type PixelPalette = Readonly<{
  id: PaletteId;
  background: `#${string}`;
  primary: `#${string}`;
  accent: `#${string}`;
}>;

export const PIXEL_PALETTES: readonly PixelPalette[] = [
  { id: "ink-coral", background: "#FFF6ED", primary: "#18212F", accent: "#F05D5E" },
  { id: "navy-mint", background: "#EEFDF7", primary: "#132A3A", accent: "#36B88A" },
  { id: "plum-lemon", background: "#FFFBEA", primary: "#43213F", accent: "#E9B949" },
  { id: "forest-sky", background: "#EFF9FF", primary: "#163B2D", accent: "#4B9FD8" },
  { id: "cocoa-peach", background: "#FFF3EC", primary: "#422C27", accent: "#EE8D6A" },
  { id: "slate-lilac", background: "#F7F4FF", primary: "#283044", accent: "#9A7FD1" },
] as const;

export const GLYPH_FAMILIES: readonly GlyphFamilyId[] = [
  "rings",
  "stripes",
  "arrows",
  "corners",
  "dots",
  "diamonds",
  "chevrons",
  "orbit",
] as const;

export function isPaletteId(value: unknown): value is PaletteId {
  return (
    typeof value === "string" &&
    PIXEL_PALETTES.some((palette) => palette.id === value)
  );
}

export function isGlyphFamilyId(value: unknown): value is GlyphFamilyId {
  return (
    typeof value === "string" &&
    (GLYPH_FAMILIES as readonly string[]).includes(value)
  );
}

export function primitive(
  value: VectorPrimitive,
): VectorPrimitive {
  return value;
}
