/**
 * Picklists for the workspace forms. They are deliberately short and plain: a farmer
 * picks the closest value instead of typing free text that later resists matching.
 */
export const RESIDUE_TYPES = [
  "wheat straw",
  "rice straw",
  "maize stover",
  "cotton stalks",
  "sugarcane bagasse",
  "mustard stubble",
  "other residue",
] as const;

export const CROPS = ["wheat", "rice", "maize", "cotton", "sugarcane", "mustard", "other"] as const;

export const STORAGE_OPTIONS = [
  { value: "covered", label: "Covered (tarpaulin or shed)" },
  { value: "partly covered", label: "Partly covered" },
  { value: "open", label: "Open to the weather" },
  { value: "baled", label: "Baled and stacked" },
] as const;
