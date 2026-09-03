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

/**
 * Reverse MW → amps
 * I = MW × 1000 / (√3 × V_kV × PF)
 */
export function computeAmpsFromMW(mw, voltageKv) {
  const load = parseFloat(mw) || 0;
  const voltage = parseFloat(voltageKv) || 0;
  if (load <= 0 || voltage <= 0) return 0;
  return (load * 1000) / (Math.sqrt(3) * voltage * POWER_FACTOR);
}

/**
 * Proportional load-shed plan
 * allotmentMW = allowed total during LS
 * If total ≤ allotment → no shed
 * Else each feeder sheds the same % of its own MW
 */
export function buildLoadShedPlan(amps, busVoltages, allotmentMW, options = {}) {
  const { excludeIds = [] } = options;
  const result = buildCalculationResult(amps, busVoltages);
  const allotment = parseFloat(allotmentMW);

  if (!Number.isFinite(allotment) || allotment < 0) {
    return {
      ...result,
      allotment: null,
      valid: false,
      needsShed: false,
      shedTotalMW: 0,
      shedPercent: 0,
      feeders: result.feeders.map((f) => ({
        ...f,
        protected: excludeIds.includes(f.id),
        shedMW: 0,
        shedPercent: 0,
        targetMW: f.mw,
        targetAmps: f.amps,
      })),
    };
  }

  const shedable = result.feeders.filter((f) => !excludeIds.includes(f.id));
  const protectedFeeders = result.feeders.filter((f) => excludeIds.includes(f.id));
  const protectedMW = protectedFeeders.reduce((s, f) => s + f.mw, 0);
  const shedableMW = shedable.reduce((s, f) => s + f.mw, 0);
  const totalMW = result.totalMW;

  // Allotment must cover protected load first
  const availableForShedable = Math.max(0, allotment - protectedMW);
  const needsShed = shedableMW > availableForShedable + 1e-9;
  const shedTotalMW = needsShed ? shedableMW - availableForShedable : 0;
  const shedPercent = shedableMW > 0 && needsShed ? (shedTotalMW / shedableMW) * 100 : 0;

  const feeders = result.feeders.map((f) => {
    const isProtected = excludeIds.includes(f.id);
    if (isProtected || !needsShed || shedableMW <= 0) {
      return {
        ...f,
        protected: isProtected,
        shedMW: 0,
        shedPercent: 0,
        targetMW: f.mw,
        targetAmps: f.amps,
      };
    }
    const ratio = f.mw / shedableMW;
    const feederShedMW = shedTotalMW * ratio;
    const targetMW = Math.max(0, f.mw - feederShedMW);
    const voltage = f.bus === 1 ? result.busVoltages.bus1 : result.busVoltages.bus2;
    const targetAmps = computeAmpsFromMW(targetMW, voltage);
    return {
      ...f,
      protected: false,
      shedMW: feederShedMW,
      shedPercent: f.mw > 0 ? (feederShedMW / f.mw) * 100 : 0,
      targetMW,
      targetAmps,
    };
  });

  return {
    ...result,
    allotment,
    valid: true,
    needsShed,
    shedTotalMW,
    shedPercent,
    protectedMW,
    shedableMW,
    feeders,
  };
}
