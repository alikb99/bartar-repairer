// The published neighbourhood hub that speaks for each area too small to have
// one of its own, read back from the deployed Service schema
// (scripts/recover-area-parents.mjs).
//
// Do not edit by hand — re-run the script.

export const AREA_PARENT: Record<string, string[]> = {
  "ayatollah-kashani": ["west-tehran"],
  "charsou": ["jomhouri"],
  "punak": ["north-tehran","west-tehran"],
  "vanak": ["north-tehran","west-tehran"],
};
