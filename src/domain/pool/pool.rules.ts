import { Pool } from "@/domain/pool/pool.types";

type EditablePool = Pick<Pool, "creatorId">;

type LifecyclePool = Pick<
  Pool,
  "status" | "closingDate" | "collectorAliasId" | "archivedAt"
>;
export type PoolLifecycle = "ACTIVE" | "COMPLETED" | "ARCHIVED";
type LifecycleStateInput = Pick<Pool, "status" | "closingDate" | "archivedAt">;

export class PoolLifecycleError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "archived"
      | "not_active"
      | "not_completed"
      | "future_date_required"
  ) {
    super(`Pool lifecycle transition rejected: ${code}`);
    this.name = "PoolLifecycleError";
  }
}

export function getPoolLifecycle(
  pool: LifecycleStateInput,
  now: Date = new Date()
): PoolLifecycle {
  if (pool.archivedAt) return "ARCHIVED";
  if (
    pool.status === "CLOSED" ||
    !isClosingDateOnOrAfterToday(pool.closingDate, now)
  )
    return "COMPLETED";
  return "ACTIVE";
}

// Preserve the established closing-day semantics (stored UTC day vs local today).
export function parseReopenClosingDate(
  value: string,
  now: Date = new Date()
): Date {
  const date = new Date(`${value}T23:59:59.999Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    getStoredClosingDateString(date) !== value ||
    !isClosingDateOnOrAfterToday(date, now)
  )
    throw new PoolLifecycleError("future_date_required");
  return date;
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStoredClosingDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isClosingDateOnOrAfterToday(
  closingDate: Date,
  now: Date = new Date()
): boolean {
  return getStoredClosingDateString(closingDate) >= getLocalDateString(now);
}

export function canEditPool(
  authenticatedUserId: string,
  pool: EditablePool
): boolean {
  return pool.creatorId === authenticatedUserId;
}

export function canClosePool(
  pool: LifecycleStateInput,
  now: Date = new Date()
): boolean {
  return getPoolLifecycle(pool, now) === "ACTIVE";
}

export function canReopenPool(
  pool: LifecycleStateInput,
  now: Date = new Date(),
  newClosingDate?: Date
): boolean {
  return (
    getPoolLifecycle(pool, now) === "COMPLETED" &&
    isClosingDateOnOrAfterToday(newClosingDate ?? pool.closingDate, now)
  );
}

export function isPoolOpenForContributions(
  pool: LifecyclePool,
  now: Date = new Date()
): boolean {
  return (
    getPoolLifecycle(pool, now) === "ACTIVE" &&
    pool.collectorAliasId !== null &&
    pool.collectorAliasId !== undefined
  );
}

export function isPoolOpenForPayment(pool: LifecyclePool, now: Date): boolean {
  return isPoolOpenForContributions(pool, now);
}
