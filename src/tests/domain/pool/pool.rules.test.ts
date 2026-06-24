import { describe, expect, it } from "vitest";

import { canReopenPool, isPoolOpenForPayment } from "@/domain/pool/pool.rules";
import { Contribution, PAYMENT_METHODS, Pool } from "@/domain/pool/pool.types";
import {
  getPublicContributionAmount,
  getPublicContributorLabel
} from "@/domain/pool/pool.visibility";

function createPool(overrides: Partial<Pool> = {}): Pool {
  return {
    id: "pool_1",
    slug: "team-birthday",
    title: "Team Birthday",
    description: "Shared gift",
    eventType: "BIRTHDAY",
    status: "OPEN",
    closingDate: new Date("2026-07-01T12:00:00.000Z"),
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    updatedAt: new Date("2026-06-01T12:00:00.000Z"),
    ...overrides
  };
}

function createContribution(
  overrides: Partial<Contribution> = {}
): Contribution {
  return {
    id: "contribution_1",
    poolId: "pool_1",
    contributorFirstName: "Jane",
    contributorLastName: "Doe",
    contributorEmail: "jane@example.com",
    amount: "20.00",
    currency: "€",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "STANDARD",
    linxoOrderStatus: "NEW",
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    ...overrides
  };
}

describe("pool rules", () => {
  it("allows payment only when the pool is open and not expired", () => {
    const pool = createPool();

    expect(
      isPoolOpenForPayment(pool, new Date("2026-06-15T12:00:00.000Z"))
    ).toBe(true);
  });

  it("does not allow payments on a closed pool", () => {
    const pool = createPool({ status: "CLOSED" });

    expect(
      isPoolOpenForPayment(pool, new Date("2026-06-15T12:00:00.000Z"))
    ).toBe(false);
  });

  it("does not allow payments on an expired pool even when status is open", () => {
    const pool = createPool({
      closingDate: new Date("2026-06-10T12:00:00.000Z")
    });

    expect(
      isPoolOpenForPayment(pool, new Date("2026-06-15T12:00:00.000Z"))
    ).toBe(false);
  });

  it("allows reopening only when the pool is closed", () => {
    expect(canReopenPool(createPool({ status: "CLOSED" }))).toBe(true);
    expect(canReopenPool(createPool({ status: "OPEN" }))).toBe(false);
  });
});

describe("pool visibility", () => {
  it("hides the contributor label when anonymity is requested", () => {
    const contribution = createContribution({ displayAsAnonymous: true });

    expect(getPublicContributorLabel(contribution)).toBe("Anonymous");
  });

  it("returns the contributor full name when anonymity is disabled", () => {
    const contribution = createContribution();

    expect(getPublicContributorLabel(contribution)).toBe("Jane Doe");
  });

  it("hides the contribution amount when requested", () => {
    const contribution = createContribution({ hideAmount: true });

    expect(getPublicContributionAmount(contribution)).toBe("Hidden amount");
  });

  it("returns the public amount when it can be displayed", () => {
    const contribution = createContribution();

    expect(getPublicContributionAmount(contribution)).toBe("20.00 €");
  });
});

describe("payment methods", () => {
  it("exposes the supported values without mapping them to provider values yet", () => {
    expect(PAYMENT_METHODS).toEqual(["STANDARD", "INSTANT"]);
  });
});
