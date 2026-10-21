import { getNearestHourSlot } from "./hourSlot";

/**
 * 26 daily logsheet slots: 00:00–23:00 plus special 18:30 and 19:30
 * Chronological order for the day view.
 */
export const LOGSHEET_SLOTS = (() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    slots.push({ label, hour: h, minute: 0, isSpecial: false });
    if (h === 18) {
      slots.push({ label: "18:30", hour: 18, minute: 30, isSpecial: true });
    }
    if (h === 19) {
      slots.push({ label: "19:30", hour: 19, minute: 30, isSpecial: true });
    }
  }
  return slots;
})();

/** Local calendar day key YYYY-MM-DD */
export function toDayKey(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Map a record to a slot label using hourSlot, or nearest slot from timestamp.
 * Examples: 08:49 → 09:00, 09:10 → 09:00 (true nearest among 26 slots).
 */
export function recordSlotLabel(record) {
  if (record?.hourSlot && typeof record.hourSlot === "string") {
    const s = record.hourSlot.trim();
    if (s) return s;
  }
  const iso = record?.calculatedAt || record?.createdAt;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return getNearestHourSlot(d).label;
}

export function formatDayLabel(dayKey) {
  if (!dayKey) return "—";
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
