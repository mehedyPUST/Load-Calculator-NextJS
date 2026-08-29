/**
 * Feeder definitions for Bottail 33/11 kV Substation
 * bus: 1 → BUS-1 voltage, 2 → BUS-2 voltage
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

export const BOTTAIL_11KV_IDS = [8, 9];

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
