/**
 * Feeder definitions for Bottail 33/11 kV Substation
 * bus: 1 → BUS-1 voltage, 2 → BUS-2 voltage
 *
 * BRB, MRS → kept free during load shed (not shed)
 * H-3, T-3 → Bottail local 11 kV (participate in LS)
 * Others → outgoing 33 kV to remote SS (participate in LS)
 */
export const FEEDERS = [
  { id: 1, name: "BRB", bus: 2 },
  { id: 2, name: "MRS", bus: 1 },
  { id: 3, name: "Mozompur", bus: 2 },
  { id: 4, name: "Housing", bus: 1 },
  { id: 5, name: "Rajbari", bus: 1 },
  { id: 6, name: "Campus", bus: 2 },
  { id: 7, name: "Koburhat", bus: 2 },
  { id: 8, name: "H-3", bus: 1 },
  { id: 9, name: "T-3", bus: 2 },
];

/** Local 11 kV at Bottail SS (H-3 + T-3) — included in load shed */
export const BOTTAIL_11KV_IDS = [8, 9];

/** Always free during LS — do not shed */
export const LS_PROTECTED_IDS = [1, 2]; // BRB, MRS

/**
 * 33 kV / local ring-line capable feeders at Bottail SS.
 * When a ring is active, amps/MW on that feeder may not reflect pure main-line load.
 * Default state: inactive.
 *
 * - Mozompur ↔ Housing (both at Bottail)
 * - Housing ↔ Campus (both at Bottail)
 * - Housing ↔ GIS (GIS external to Bottail list)
 * - Koburhat ↔ Alomdanga (external)
 * - Rajbari ↔ Pangsha (external)
 * - H-3 ↔ T-3 (local 11 kV; can share load, one may remain shutdown)
 *
 * Indicator toggle is available for ALL feeders (not only those listed here).
 */
export const RING_LINES = [
  {
    id: "mozompur-housing",
    feederIds: [3, 4],
    label: "Mozompur ↔ Housing",
    partner: "Housing / Mozompur",
  },
  {
    id: "housing-campus",
    feederIds: [4, 6],
    label: "Housing ↔ Campus",
    partner: "Campus / Housing",
  },
  {
    id: "housing-gis",
    feederIds: [4],
    label: "Housing ↔ GIS",
    partner: "GIS (external)",
  },
  {
    id: "koburhat-alomdanga",
    feederIds: [7],
    label: "Koburhat ↔ Alomdanga",
    partner: "Alomdanga",
  },
  {
    id: "rajbari-pangsha",
    feederIds: [5],
    label: "Rajbari ↔ Pangsha",
    partner: "Pangsha",
  },
  {
    id: "h3-t3",
    feederIds: [8, 9],
    label: "H-3 ↔ T-3",
    partner: "H-3 / T-3",
  },
];

/** feederId → short partner label for the Ring column tooltip */
export const RING_BY_FEEDER = (() => {
  const map = {};
  for (const line of RING_LINES) {
    for (const fid of line.feederIds) {
      if (!map[fid]) {
        map[fid] = {
          partner: line.partner,
          labels: [line.label],
        };
      } else {
        map[fid].labels.push(line.label);
        // Prefer a combined partner hint for multi-ring feeders (Housing)
        map[fid].partner = map[fid].labels.join(" · ");
      }
    }
  }
  return map;
})();

/** MW = (√3 × V_kV × PF × I_A) / 1000 */
export const POWER_FACTOR = 0.95;

export const APP_META = {
  title: "WZPDCL Load Calculator | Bottail-Kushtia",
  shortTitle: "WZPDCL - Bottail-Kushtia",
  subtitle: "33/11 kV Power Substation",
  tagline: "Load Calculator Dashboard",
  footer: "© All Rights Reserved · SBA-Bottail, WZPDCL",
  logoUrl: "https://i.ibb.co.com/sL3vSkg/Logo.png",
};
