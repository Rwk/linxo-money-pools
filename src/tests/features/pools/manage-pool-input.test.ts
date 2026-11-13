import { describe, expect, it } from "vitest";

import {
  parseManagePoolFormValues,
  validateManagePoolInput
} from "@/features/pools/domain/manage-pool-input";
import { t } from "@/i18n/t";

describe("manage pool input", () => {
  it("rejects an empty title after trimming", () => {
    const result = validateManagePoolInput(
      {
        title: "   ",
        description: "  Team gift  ",
        eventType: "BIRTHDAY",
        closingDate: "2026-07-05"
      },
      new Date("2026-06-30T10:00:00.000Z")
    );

    expect(result.success).toBe(false);
    expect(result.success ? null : result.fieldErrors.title).toBe(
      t("validation.titleRequired")
    );
  });

  it("trims title and description", () => {
    const result = validateManagePoolInput(
      {
        title: "  Team gift  ",
        description: "  Shared contribution  ",
        eventType: "BIRTHDAY",
        closingDate: "2026-07-05"
      },
      new Date("2026-06-30T10:00:00.000Z")
    );

    expect(result).toEqual({
      success: true,
      data: {
        title: "Team gift",
        description: "Shared contribution",
        eventType: "BIRTHDAY",
        closingDate: new Date("2026-07-05T23:59:59.999Z")
      }
    });
  });

  it("rejects unsupported event types", () => {
    const result = validateManagePoolInput(
      {
        title: "Team gift",
        description: "Shared contribution",
        eventType: "NOPE" as "BIRTHDAY",
        closingDate: "2026-07-05"
      },
      new Date("2026-06-30T10:00:00.000Z")
    );

    expect(result.success).toBe(false);
    expect(result.success ? null : result.fieldErrors.eventType).toBe(
      t("validation.eventTypeRequired")
    );
  });

  it("rejects past closing dates", () => {
    const result = validateManagePoolInput(
      {
        title: "Team gift",
        description: "Shared contribution",
        eventType: "BIRTHDAY",
        closingDate: "2026-06-29"
      },
      new Date("2026-06-30T10:00:00.000Z")
    );

    expect(result.success).toBe(false);
    expect(result.success ? null : result.fieldErrors.closingDate).toBe(
      t("validation.closingDateFuture")
    );
  });

  it("accepts titles with accents and punctuation for display", () => {
    const result = validateManagePoolInput(
      {
        title: "Départ de Raph",
        description: "Shared contribution",
        eventType: "BIRTHDAY",
        closingDate: "2026-07-05"
      },
      new Date("2026-06-30T10:00:00.000Z")
    );

    expect(result.success).toBe(true);
  });

  it("reads form data values", () => {
    const formData = new FormData();
    formData.set("title", "Team gift");
    formData.set("description", "Shared contribution");
    formData.set("eventType", "BIRTHDAY");
    formData.set("closingDate", "2026-07-05");

    expect(parseManagePoolFormValues(formData)).toEqual({
      title: "Team gift",
      description: "Shared contribution",
      eventType: "BIRTHDAY",
      closingDate: "2026-07-05"
    });
  });
});

describe("optional description", () => {
  it.each(["", "   \n  ", "  Une description existante  "])(
    "accepts and trims %j",
    (description) => {
      const result = validateManagePoolInput({
        title: "Title",
        description,
        eventType: "OTHER",
        closingDate: "2099-01-01"
      });
      expect(result.success).toBe(true);
      if (result.success)
        expect(result.data.description).toBe(description.trim());
    }
  );
  it("keeps description length and title requirements", () => {
    const result = validateManagePoolInput({
      title: " ",
      description: "x".repeat(2001),
      eventType: "OTHER",
      closingDate: "2099-01-01"
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.description).toBeTruthy();
      expect(result.fieldErrors.title).toBeTruthy();
    }
  });
});
