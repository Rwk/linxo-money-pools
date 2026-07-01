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
