import { Pool } from "@/domain/pool/pool.types";

export function isPoolOpenForPayment(pool: Pool, now: Date): boolean {
  return pool.status === "OPEN" && pool.closingDate.getTime() > now.getTime();
}

export function canReopenPool(pool: Pool): boolean {
  return pool.status === "CLOSED";
}
