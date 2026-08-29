import { FEEDERS, BOTTAIL_11KV_IDS, POWER_FACTOR } from "./constants";

/**
 * Core MW formula — DO NOT CHANGE
 * MW = (√3 × voltage_kV × 0.95 × amps) / 1000
 */
export function computeFeederMW(amps, voltageKv) {
  const amp = parseFloat(amps) || 0;
  const voltage = parseFloat(voltageKv) || 0;
  if (amp <= 0 || voltage <= 0) return 0;
  return (Math.sqrt(3) * voltage * POWER_FACTOR * amp) / 1000;
}

/**
 * Resolve bus voltage for a feeder
 */
export function getVoltageForFeeder(feeder, busVoltages) {
  return feeder.bus === 1 ? busVoltages.bus1 : busVoltages.bus2;
}

/**
 * MW for a single feeder by id
 */
export function getFeederMW(feederId, amps, busVoltages) {
  const feeder = FEEDERS.find((f) => f.id === feederId);
  if (!feeder) return 0;
  const voltage = getVoltageForFeeder(feeder, busVoltages);
  return computeFeederMW(amps[feederId], voltage);
}

/**
 * Full calculation snapshot used for display and API payload
 */
export function buildCalculationResult(amps, busVoltages) {
  const feeders = FEEDERS.map((item) => {
    const voltage = getVoltageForFeeder(item, busVoltages);
    const ampVal = parseFloat(amps[item.id]) || 0;
    const mw = computeFeederMW(ampVal, voltage);
    return {
      id: item.id,
      name: item.name,
      bus: item.bus,
      amps: ampVal,
      mw,
    };
  });

  const totalMW = feeders.reduce((sum, f) => sum + f.mw, 0);
  const bottail11kV = BOTTAIL_11KV_IDS.reduce((sum, id) => {
    const f = feeders.find((x) => x.id === id);
    return sum + (f?.mw || 0);
  }, 0);

  return {
    busVoltages: {
      bus1: parseFloat(busVoltages.bus1) || 0,
      bus2: parseFloat(busVoltages.bus2) || 0,
    },
    feeders,
    bottail11kV,
    totalMW,
  };
}

/**
 * Initial amps map: all feeders start at "0"
 */
export function createInitialAmps() {
  const initial = {};
  FEEDERS.forEach((item) => {
    initial[item.id] = "0";
  });
  return initial;
}
