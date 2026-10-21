import Calculation from "@/lib/models/Calculation";

/**
 * Auto-purge disabled — textual load data is retained indefinitely.
 * Soft-deleted items remain in trash until the user permanently deletes them.
 */
export const TRASH_RETENTION_DAYS = null;

/**
 * No automatic permanent deletion.
 * Kept as a no-op so existing call sites remain safe.
 */
export async function purgeExpiredTrash() {
  return 0;
}

/** @deprecated Auto-expiry disabled; always returns null */
export function daysLeftInTrash() {
  return null;
}
