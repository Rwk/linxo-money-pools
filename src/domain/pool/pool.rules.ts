import { Pool } from "@/domain/pool/pool.types";

type EditablePool = Pick<Pool, "creatorId">;

type LifecyclePool = Pick<Pool, "status" | "closingDate" | "collectorAliasId">;

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

export function canClosePool(pool: Pick<LifecyclePool, "status">): boolean {
  return pool.status === "OPEN";
}

export function canReopenPool(
  pool: Pick<LifecyclePool, "status" | "closingDate">,
  now: Date = new Date()
): boolean {
  return pool.status === "CLOSED" && isClosingDateOnOrAfterToday(pool.closingDate, now);
}

export function isPoolOpenForContributions(
  pool: LifecyclePool,
  now: Date = new Date()
): boolean {
  return (
    pool.status === "OPEN" &&
    pool.collectorAliasId !== null &&
    pool.collectorAliasId !== undefined &&
    isClosingDateOnOrAfterToday(pool.closingDate, now)
  );
}

export function isPoolOpenForPayment(pool: LifecyclePool, now: Date): boolean {
  return isPoolOpenForContributions(pool, now);
}
