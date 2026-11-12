import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { PoolWithContributions } from "@/features/pools/data-access/pool-repository";

const mocks = vi.hoisted(() => ({
  findPoolBySlug: vi.fn(),
  findPoolByIdForCreator: vi.fn(),
  requireLinxoSession: vi.fn(),
  publicForm: vi.fn()
}));
vi.mock(
  "@/features/pools/data-access/pool-repository",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/pools/data-access/pool-repository")
    >()),
    findPoolBySlug: mocks.findPoolBySlug,
    findPoolByIdForCreator: mocks.findPoolByIdForCreator
  })
);
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: mocks.requireLinxoSession
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  }
}));
vi.mock("@/features/contributions/components/public-contribution-form", () => ({
  PublicContributionForm: (props: unknown) => {
    mocks.publicForm(props);
    return null;
  }
}));
vi.mock("@/features/pools/components/pool-management-cockpit", () => ({
  PoolManagementCockpit: ({ pool }: { pool: unknown }) =>
    React.createElement("pre", null, JSON.stringify(pool))
}));

import PublicPoolPage from "@/app/p/[slug]/page";
import PoolManagementPage from "@/app/(authenticated)/dashboard/pools/[poolId]/page";
import {
  toPoolCardViewModel,
  toPrivatePoolDetailViewModel,
  toPublicPoolDetailViewModel
} from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";
import { toPaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";

type Record = PoolWithContributions["contributions"][number];
function contribution(overrides: Partial<Record> = {}): Record {
  return {
    id: "public",
    poolId: "pool_test",
    contributorFirstName: "Camille",
    contributorLastName: "Test",
    contributorEmail: "camille@example.com",
    amount: new Prisma.Decimal("12.34"),
    currency: "EUR",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "STANDARD",
    linxoOrderId: "order_test",
    linxoInstructionId: null,
    linxoPaymentId: null,
    linxoSettlementId: null,
    linxoOrderStatus: "CLOSED",
    linxoPaymentStatus: "EXECUTED",
    linxoSettlementStatus: null,
    cashInStatus: "EXECUTED",
    createdAt: new Date("2026-11-12T12:00:00Z"),
    returnedAt: null,
    ...overrides
  };
}
function pool(): PoolWithContributions {
  return {
    contributionMode: "FREE",
    fixedUnitPriceCents: null,
    id: "pool_test",
    slug: "privacy-test",
    title: "Cadeau",
    description: "Test de confidentialité",
    eventType: "OTHER",
    status: "OPEN",
    closingDate: new Date("2099-01-01T00:00:00Z"),
    creatorId: "owner",
    collectorDisplayName: "Équipe",
    collectorAuthorizedAccountId: "authorized_test",
    collectorAliasId: "alias_test",
    createdAt: new Date("2026-11-12T12:00:00Z"),
    updatedAt: new Date("2026-11-12T12:00:00Z"),
    closedAt: null,
    contributions: [
      contribution(),
      contribution({
        id: "hidden",
        amount: new Prisma.Decimal("918.73"),
        hideAmount: true,
        displayAsAnonymous: true
      }),
      contribution({
        id: "pending-hidden",
        amount: new Prisma.Decimal("82.61"),
        hideAmount: true,
        cashInStatus: "PENDING",
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      }),
      contribution({
        id: "rejected-hidden",
        amount: new Prisma.Decimal("43.27"),
        hideAmount: true,
        cashInStatus: "REJECTED",
        linxoOrderStatus: "REJECTED",
        linxoPaymentStatus: null
      })
    ]
  };
}

describe("pool amount privacy at presentation and response boundaries", () => {
  it("keeps hidden fixed-price amounts out of public aggregates and never exposes their quantity", () => {
    const fixture = pool();
    fixture.contributionMode = "FIXED";
    fixture.fixedUnitPriceCents = 1250;
    fixture.contributions = [
      contribution({ amount: new Prisma.Decimal("12.50") }),
      contribution({
        id: "hidden",
        amount: new Prisma.Decimal("37.50"),
        hideAmount: true
      })
    ];
    const publicView = toPublicPoolDetailViewModel(fixture);
    expect(publicView.confirmedAmountLabel).toBe("12.50 EUR");
    expect(toPrivatePoolDetailViewModel(fixture).confirmedAmountLabel).toBe(
      "50.00 EUR"
    );
    expect(JSON.stringify(publicView)).not.toContain("37.50");
    expect(JSON.stringify(publicView)).not.toContain("50.00");
    expect(JSON.stringify(publicView)).not.toContain("quantity");
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps public rows and existing name rules while omitting private monetary values and fields", () => {
    const view = toPublicPoolDetailViewModel(pool());
    expect(view.confirmedAmountLabel).toBe("12.34 EUR");
    expect(view.inProgressAmountLabel).toBe("0.00 EUR");
    expect(view.hiddenAmountNotice).toBe(t("poolDetails.hiddenAmountsNotice"));
    expect(
      view.visibleContributions.map((row) => [
        row.id,
        row.contributorLabel,
        row.amountLabel
      ])
    ).toEqual([
      ["public", "Camille Test", "12.34 EUR"],
      ["hidden", t("common.anonymous"), t("common.hiddenAmount")],
      ["pending-hidden", "Camille Test", t("common.hiddenAmount")]
    ]);
    const json = JSON.stringify(view);
    for (const value of [
      "918.73",
      "82.61",
      "43.27",
      "931.07",
      "camille@example.com",
      "order_test",
      "alias_test",
      "authorized_test",
      "privateTotals",
      "incompleteAmount"
    ]) {
      expect(json).not.toContain(value);
    }
  });

  it("does not change any public monetary or derived data when hidden amounts change", () => {
    const first = pool();
    const second = pool();
    for (const item of second.contributions.filter((item) => item.hideAmount))
      item.amount = new Prisma.Decimal("7777.77");
    expect(toPublicPoolDetailViewModel(second)).toEqual(
      toPublicPoolDetailViewModel(first)
    );
  });

  it("shows zero and a generic notice when all confirmed amounts are hidden", () => {
    const fixture = pool();
    fixture.contributions = [fixture.contributions[1]];
    const view = toPublicPoolDetailViewModel(fixture);
    expect(view.confirmedAmountLabel).toBe("0.00 EUR");
    expect(view.visibleContributions).toHaveLength(1);
    expect(view.hiddenAmountNotice).toBe(t("poolDetails.hiddenAmountsNotice"));
    fixture.contributions = [];
    const empty = toPublicPoolDetailViewModel(fixture);
    expect(empty.confirmedAmountLabel).toBe("0.00 EUR");
    expect(empty.hiddenAmountNotice).toBeUndefined();
  });

  it("keeps the client handoff payload free of the hidden amount and personal details", () => {
    const fixture = pool();
    const view = toPaymentHandoffViewModel({
      contribution: {
        ...fixture.contributions[1],
        pool: fixture,
        authUrl: "https://payments.invalid/test",
        shortAuthUrl: null,
        paymentAccessToken: "test_access",
        paymentLinkOpenedAt: null,
        paymentLinkOpenedSource: null
      },
      directPaymentUrl: null,
      qrCodeUrl: null,
      statusApiUrl: "/api/test"
    });
    expect(view.amountLabel).toBe(t("common.hiddenAmount"));
    expect(view.contributorLabel).toBe(t("common.anonymous"));
    for (const value of [
      "918.73",
      "camille@example.com",
      "Camille",
      "Test",
      "https://payments.invalid/test"
    ])
      expect(JSON.stringify(view)).not.toContain(value);
  });

  it("keeps complete totals and recorded names/amounts on private views and dashboard cards", () => {
    const view = toPrivatePoolDetailViewModel(pool());
    expect(view.confirmedAmountLabel).toBe("931.07 EUR");
    expect(view.inProgressAmountLabel).toBe("82.61 EUR");
    expect(
      view.visibleContributions.find((row) => row.id === "hidden")
    ).toMatchObject({
      contributorLabel: "Camille Test",
      amountLabel: "918.73 EUR"
    });
    expect(view.incompleteContributions[0].amountLabel).toBe("43.27 EUR");
    expect(toPoolCardViewModel(pool()).confirmedAmountLabel).toBe("931.07 EUR");
  });

  it("renders the public response with safe totals and passes only form context to the client", async () => {
    mocks.findPoolBySlug.mockResolvedValue(pool());
    const html = renderToStaticMarkup(
      await PublicPoolPage({
        params: Promise.resolve({ slug: "privacy-test" })
      })
    );
    expect(html).toContain("12.34 EUR");
    expect(html).toContain(t("common.hiddenAmount"));
    expect(html).toContain(t("poolDetails.publicConfirmedAmount"));
    expect(html).toContain(t("poolDetails.publicInProgressAmount"));
    expect(html).toContain(t("poolDetails.hiddenAmountsNotice"));
    for (const value of [
      "918.73",
      "82.61",
      "43.27",
      "931.07",
      "camille@example.com",
      "<progress",
      "aria-valuenow"
    ])
      expect(html).not.toContain(value);
    expect(mocks.publicForm.mock.calls[0][0]).toEqual({
      contributionMode: "FREE",
      fixedUnitPriceCents: null,
      collectorDisplayName: "Équipe",
      poolSlug: "privacy-test"
    });
  });

  it("gives the authenticated owner full contribution details", async () => {
    mocks.requireLinxoSession.mockResolvedValue({ id: "owner" });
    mocks.findPoolByIdForCreator.mockResolvedValue(pool());
    const html = renderToStaticMarkup(
      await PoolManagementPage({
        params: Promise.resolve({ poolId: "pool_test" })
      })
    );
    expect(mocks.findPoolByIdForCreator).toHaveBeenCalledWith(
      "pool_test",
      "owner"
    );
    for (const value of [
      "931.07 EUR",
      "918.73 EUR",
      "43.27 EUR",
      "Camille Test"
    ])
      expect(html).toContain(value);
  });

  it("refuses anonymous owner-page access before loading private data", async () => {
    mocks.requireLinxoSession.mockRejectedValue(new Error("SIGN_IN_REQUIRED"));
    await expect(
      PoolManagementPage({ params: Promise.resolve({ poolId: "pool_test" }) })
    ).rejects.toThrow("SIGN_IN_REQUIRED");
    expect(mocks.findPoolByIdForCreator).not.toHaveBeenCalled();
  });

  it("refuses another user's owner page even if a repository returns the pool", async () => {
    mocks.requireLinxoSession.mockResolvedValue({ id: "other" });
    mocks.findPoolByIdForCreator.mockResolvedValue(pool());
    await expect(
      PoolManagementPage({ params: Promise.resolve({ poolId: "pool_test" }) })
    ).rejects.toThrow("NOT_FOUND");
  });
});
