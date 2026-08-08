/**
 * Team colour palette. Each entry is a small, self-contained theme so a team's
 * colour can drive crests, cards, bars and glows without any per-component
 * guesswork. All values are plain hex/rgb so they work in inline styles,
 * SVG gradients and canvas alike.
 */
export type TeamColor = {
  id: string;
  label: string;
  /** Main brand colour. */
  base: string;
  /** Lighter end of the crest gradient. */
  light: string;
  /** Darker end of the crest gradient. */
  dark: string;
  /** Very soft tint for card backgrounds in light mode. */
  tint: string;
};

export const TEAM_COLORS: TeamColor[] = [
  {
    id: "moss",
    label: "Moss",
    base: "#3f9142",
    light: "#6fc46f",
    dark: "#276b2c",
    tint: "#eaf7ea",
  },
  {
    id: "fern",
    label: "Fern",
    base: "#2f9e6f",
    light: "#63cfa0",
    dark: "#1c7050",
    tint: "#e6f7f0",
  },
  {
    id: "pine",
    label: "Pine",
    base: "#1f7a5a",
    light: "#4fb08c",
    dark: "#12523c",
    tint: "#e4f4ee",
  },
  {
    id: "lagoon",
    label: "Lagoon",
    base: "#17a2a2",
    light: "#54d0d0",
    dark: "#0e6f6f",
    tint: "#e2f7f7",
  },
  { id: "sky", label: "Sky", base: "#2b8fd6", light: "#68bdf2", dark: "#1a6299", tint: "#e6f2fc" },
  {
    id: "cobalt",
    label: "Cobalt",
    base: "#3358cc",
    light: "#6d8bf0",
    dark: "#22399180",
    tint: "#e9edfc",
  },
  {
    id: "indigo",
    label: "Indigo",
    base: "#5a4bd1",
    light: "#8d81ee",
    dark: "#3d3195",
    tint: "#eeecfd",
  },
  {
    id: "violet",
    label: "Violet",
    base: "#8244cf",
    light: "#ac7ded",
    dark: "#5b2d94",
    tint: "#f3ecfd",
  },
  {
    id: "orchid",
    label: "Orchid",
    base: "#b94bbf",
    light: "#dc84e0",
    dark: "#832f88",
    tint: "#fbecfc",
  },
  {
    id: "rose",
    label: "Rose",
    base: "#d94a76",
    light: "#f286a8",
    dark: "#9c2f52",
    tint: "#fdecf2",
  },
  {
    id: "ember",
    label: "Ember",
    base: "#dc4a3d",
    light: "#f5877c",
    dark: "#9d2f25",
    tint: "#fdedeb",
  },
  {
    id: "amber",
    label: "Amber",
    base: "#e08b1e",
    light: "#f5bb62",
    dark: "#a1600f",
    tint: "#fdf3e3",
  },
  { id: "sun", label: "Sun", base: "#d4a017", light: "#f0cd5c", dark: "#96700c", tint: "#fcf6e2" },
  {
    id: "clay",
    label: "Clay",
    base: "#b0673c",
    light: "#d9986f",
    dark: "#7c4526",
    tint: "#f9efe8",
  },
  {
    id: "stone",
    label: "Stone",
    base: "#5f6b7a",
    light: "#94a2b3",
    dark: "#3f4854",
    tint: "#eef1f4",
  },
  {
    id: "obsidian",
    label: "Obsidian",
    base: "#37414d",
    light: "#69737f",
    dark: "#232a33",
    tint: "#eceff2",
  },
];

export const DEFAULT_COLOR_ORDER = [
  "moss",
  "sky",
  "amber",
  "ember",
  "violet",
  "lagoon",
  "rose",
  "cobalt",
  "sun",
  "pine",
  "orchid",
  "clay",
  "indigo",
  "fern",
  "stone",
  "obsidian",
];

const BY_ID = new Map(TEAM_COLORS.map((c) => [c.id, c]));

export function getColor(id: string): TeamColor {
  return BY_ID.get(id) ?? TEAM_COLORS[0];
}

export function isColorId(id: string): boolean {
  return BY_ID.has(id);
}

export function defaultColorFor(index: number): string {
  return DEFAULT_COLOR_ORDER[index % DEFAULT_COLOR_ORDER.length];
}
