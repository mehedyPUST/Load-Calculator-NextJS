import Calculation from "@/lib/models/Calculation";

/** Days items stay in trash before permanent removal */
export const TRASH_RETENTION_DAYS = 30;

/**
 * Permanently delete trash items older than retention period.
 * Call on list/trash operations so cleanup is automatic.
 */
export async function purgeExpiredTrash() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const result = await Calculation.deleteMany({
    deletedAt: { $ne: null, $lt: cutoff },
  });

  return result.deletedCount || 0;
}

export function daysLeftInTrash(deletedAt) {
  if (!deletedAt) return null;
  const end = new Date(deletedAt);
  end.setDate(end.getDate() + TRASH_RETENTION_DAYS);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
