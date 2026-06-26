import { describe, expect, it } from "vitest";

import {
  isClosingDateOnOrAfterToday,
  validateCreatePoolInput
} from "@/features/pools/domain/create-pool-input";
import {
  getCreatePoolDefaultValues,
  getInitialCreatePoolFormState
} from "@/features/pools/forms/create-pool-form-state";

describe("create pool validation", () => {
  it("provides a stable initial form state", () => {
    expect(getInitialCreatePoolFormState()).toEqual({
      values: {
        title: "",
        description: "",
        eventType: "BIRTHDAY",
        closingDate: "",
        collectorDisplayName: ""
      },
      fieldErrors: {},
      formError: null
    });
  });

  it("accepts a valid payload and trims text fields", () => {
    const result = validateCreatePoolInput(
      {
        title: "  Team birthday gift  ",
        description: "  Shared contribution for a birthday present.  ",
        eventType: "BIRTHDAY",
        closingDate: "2026-06-30",
        collectorDisplayName: "  Linxo Team  "
      },
      new Date("2026-06-26T10:00:00.000Z")
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe("Team birthday gift");
      expect(result.data.description).toBe(
        "Shared contribution for a birthday present."
      );
      expect(result.data.collectorDisplayName).toBe("Linxo Team");
    }
  });

  it("rejects a closing date in the past", () => {
    const result = validateCreatePoolInput(
      {
        title: "Pool",
        description: "Description",
        eventType: "BIRTHDAY",
        closingDate: "2026-06-25",
        collectorDisplayName: "Linxo Team"
      },
      new Date("2026-06-26T10:00:00.000Z")
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors.closingDate).toBe(
        "Closing date must be today or later."
      );
    }
  });

  it("rejects unsupported event types", () => {
    const result = validateCreatePoolInput(
      {
        title: "Pool",
        description: "Description",
        eventType: "PARTY" as "BIRTHDAY",
        closingDate: "2026-06-26",
        collectorDisplayName: "Linxo Team"
      },
      new Date("2026-06-26T10:00:00.000Z")
    );

    expect(result.success).toBe(false);
  });

  it("does not expose IBAN or KYC fields through the validation shape", () => {
    const payload = {
      ...getCreatePoolDefaultValues(),
      title: "Pool title",
      description: "Pool description",
      eventType: "OTHER" as const,
      closingDate: "2026-06-28",
      collectorDisplayName: "Linxo Team",
      iban: "FR761234567890",
      beneficiaryKyc: "not allowed"
    };

    const result = validateCreatePoolInput(
      payload,
      new Date("2026-06-26T10:00:00.000Z")
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect("iban" in result.data).toBe(false);
      expect("beneficiaryKyc" in result.data).toBe(false);
    }
  });
});

describe("closing date helper", () => {
  it("accepts today and future dates", () => {
    const now = new Date("2026-06-26T10:00:00.000Z");

    expect(isClosingDateOnOrAfterToday("2026-06-26", now)).toBe(true);
    expect(isClosingDateOnOrAfterToday("2026-06-27", now)).toBe(true);
  });

  it("rejects earlier dates", () => {
    expect(
      isClosingDateOnOrAfterToday(
        "2026-06-25",
        new Date("2026-06-26T10:00:00.000Z")
      )
    ).toBe(false);
  });
});
