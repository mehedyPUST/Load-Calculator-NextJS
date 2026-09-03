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
 * Current (already applied) LS in MW per feeder — default "0"
 */
export function createInitialCurrentLs() {
  const initial = {};
  FEEDERS.forEach((item) => {
    initial[item.id] = "0";
  });
  return initial;
}

/** @deprecated use createInitialCurrentLs */
export function createInitialPriorLs() {
  return createInitialCurrentLs();
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
 *
 * Inputs:
 *   - amps[id]           = current running amps
 *   - currentLsMW[id]    = LS already applied on that feeder (MW)
 *   - allotmentMW        = total allowed MW
 *   - excludeIds         = free feeders (BRB, MRS) — not shed further
 *
 * Outputs per feeder:
 *   - targetMW / targetAmps
 *   - moreLsMW           = additional MW to shed now
 *   - currentLsMW        = already applied
 *   - totalLsMW          = currentLsMW + moreLsMW
 */
export function buildLoadShedPlan(amps, busVoltages, allotmentMW, options = {}) {
  const { excludeIds = [], currentLsMW = {}, priorLsPct = {} } = options;
  const result = buildCalculationResult(amps, busVoltages);
  const allotment = parseFloat(allotmentMW);

  const withCurrentLs = result.feeders.map((f) => {
    // Prefer explicit MW; fall back to legacy prior % if provided
    let already = parseFloat(currentLsMW[f.id]);
    if (!Number.isFinite(already) || already < 0) {
      const prior = Math.min(100, Math.max(0, parseFloat(priorLsPct[f.id]) || 0));
      already = prior > 0 && prior < 100 ? (f.mw * prior) / (100 - prior) : 0;
    }
    already = Math.max(0, already);
    return {
      ...f,
      currentLsMW: already,
      originalMW: f.mw + already,
    };
  });

  const baseRow = (f, isProtected) => ({
    ...f,
    protected: isProtected,
    moreLsMW: 0,
    shedMW: 0,
    shedPercent: 0,
    targetMW: f.mw,
    targetAmps: f.amps,
    totalLsMW: f.currentLsMW,
  });

  if (!Number.isFinite(allotment) || allotment < 0) {
    return {
      ...result,
      feeders: withCurrentLs.map((f) => baseRow(f, excludeIds.includes(f.id))),
      allotment: null,
      valid: false,
      needsShed: false,
      shedTotalMW: 0,
      shedPercent: 0,
      protectedMW: 0,
      shedableMW: 0,
      availableForShedable: 0,
      totalCurrentLsMW: withCurrentLs.reduce((s, f) => s + f.currentLsMW, 0),
    };
  }

  const protectedFeeders = withCurrentLs.filter((f) => excludeIds.includes(f.id));
  const shedable = withCurrentLs.filter((f) => !excludeIds.includes(f.id));
  const protectedMW = protectedFeeders.reduce((s, f) => s + f.mw, 0);
  const shedableMW = shedable.reduce((s, f) => s + f.mw, 0);
  const totalCurrentLsMW = withCurrentLs.reduce((s, f) => s + f.currentLsMW, 0);

  const availableForShedable = Math.max(0, allotment - protectedMW);
  const needsShed = shedableMW > availableForShedable + 1e-9;
  const shedTotalMW = needsShed ? shedableMW - availableForShedable : 0;
  const shedPercent =
    shedableMW > 0 && needsShed ? (shedTotalMW / shedableMW) * 100 : 0;

  const feeders = withCurrentLs.map((f) => {
    const isProtected = excludeIds.includes(f.id);
    if (isProtected || !needsShed || shedableMW <= 0) {
      return baseRow(f, isProtected);
    }

    const ratio = f.mw / shedableMW;
    const moreLsMW = shedTotalMW * ratio;
    const targetMW = Math.max(0, f.mw - moreLsMW);
    const voltage =
      f.bus === 1 ? result.busVoltages.bus1 : result.busVoltages.bus2;
    const targetAmps = computeAmpsFromMW(targetMW, voltage);
    const newShedPct = f.mw > 0 ? (moreLsMW / f.mw) * 100 : 0;

    return {
      ...f,
      protected: false,
      moreLsMW,
      shedMW: moreLsMW,
      shedPercent: newShedPct,
      targetMW,
      targetAmps,
      totalLsMW: f.currentLsMW + moreLsMW,
    };
  });

  return {
    ...result,
    feeders,
    allotment,
    valid: true,
    needsShed,
    shedTotalMW,
    shedPercent,
    protectedMW,
    shedableMW,
    availableForShedable,
    totalCurrentLsMW,
  };
}
