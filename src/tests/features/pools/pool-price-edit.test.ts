import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  query: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  create: vi.fn()
}));
vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction }
}));
import { updatePoolPriceAndDetails } from "@/features/pools/data-access/pool-repository";
import { createContributionRecord } from "@/features/contributions/data-access/contribution-repository";

describe("pricing write transactions", () => {
  const details = {
    poolId: "pool",
    creatorId: "owner",
    title: "Edited",
    description: "Description",
    eventType: "OTHER" as const,
    closingDate: new Date("2099-01-01"),
    fixedUnitPriceCents: 1600
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue({ contributionMode: "FIXED" });
    mocks.findUnique.mockResolvedValue({ fixedUnitPriceCents: 1250 });
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue({
      id: "contribution",
      paymentAccessToken: "test-token"
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: mocks.query,
        pool: {
          findFirst: mocks.findFirst,
          findUnique: mocks.findUnique,
          update: mocks.update
        },
        contribution: { count: mocks.count, create: mocks.create }
      })
    );
  });
  it("locks before the scoped eligibility lookup, counts every contribution, and updates details/price together", async () => {
    await updatePoolPriceAndDetails(details);
    expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.findFirst.mock.invocationCallOrder[0]
    );
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: "pool", creatorId: "owner" },
      select: { contributionMode: true }
    });
    expect(mocks.count).toHaveBeenCalledWith({ where: { poolId: "pool" } });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "pool" },
      data: {
        title: "Edited",
        description: "Description",
        eventType: "OTHER",
        closingDate: details.closingDate,
        fixedUnitPriceCents: 1600
      }
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "ReadCommitted"
    });
  });
  it("refuses any contribution before updating either price or ordinary details", async () => {
    mocks.count.mockResolvedValue(1);
    await expect(updatePoolPriceAndDetails(details)).rejects.toMatchObject({
      name: "FixedPriceLockedError"
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rechecks ownership inside the transaction", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(updatePoolPriceAndDetails(details)).rejects.toThrow(
      "Pool access denied."
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not change a FREE pool's pricing or mode", async () => {
    mocks.findFirst.mockResolvedValue({ contributionMode: "FREE" });
    await expect(updatePoolPriceAndDetails(details)).rejects.toMatchObject({
      name: "FixedPriceLockedError"
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, Number.NaN, 2147483648])(
    "rejects invalid cents %j",
    async (cents) => {
      await expect(
        updatePoolPriceAndDetails({ ...details, fixedUnitPriceCents: cents })
      ).rejects.toThrow();
      expect(mocks.transaction).not.toHaveBeenCalled();
    }
  );
  const contribution = {
    poolId: "pool",
    contributorFirstName: "Jane",
    contributorLastName: "Test",
    contributorEmail: "jane@example.com",
    amount: "12.50",
    expectedFixedUnitPriceCents: 1250,
    selectedPaymentMethod: "STANDARD" as const,
    displayAsAnonymous: false,
    hideAmount: false
  };
  it("takes the same lock and checks the server pricing snapshot before inserting", async () => {
    await createContributionRecord(contribution);
    expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.findUnique.mock.invocationCallOrder[0]
    );
    expect(mocks.findUnique.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.create.mock.invocationCallOrder[0]
    );
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.amount.toFixed(2)).toBe("12.50");
    expect(data).not.toHaveProperty("expectedFixedUnitPriceCents");
  });
  it("rejects a changed server snapshot instead of persisting a stale amount", async () => {
    mocks.findUnique.mockResolvedValue({ fixedUnitPriceCents: 1600 });
    await expect(createContributionRecord(contribution)).rejects.toMatchObject({
      field: "quantity"
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
