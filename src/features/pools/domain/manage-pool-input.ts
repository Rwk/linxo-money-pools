import { z } from "zod";

import { EVENT_TYPES } from "@/domain/pool/pool.types";
import {
  isClosingDateOnOrAfterToday
} from "@/domain/pool/pool.rules";
import type { ManagePoolFormValues } from "@/features/pools/forms/manage-pool-form-state";
import { t } from "@/i18n/t";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

function parseClosingDate(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

const ManagePoolSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, t("validation.titleRequired"))
      .max(TITLE_MAX_LENGTH, t("validation.titleMax", { count: TITLE_MAX_LENGTH })),
    description: z
      .string()
      .trim()
      .min(1, t("validation.descriptionRequired"))
      .max(
        DESCRIPTION_MAX_LENGTH,
        t("validation.descriptionMax", { count: DESCRIPTION_MAX_LENGTH })
      ),
    eventType: z.enum(EVENT_TYPES, {
      message: t("validation.eventTypeRequired")
    }),
    closingDate: z
      .string()
      .min(1, t("validation.closingDateRequired"))
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: t("validation.closingDateFormat")
      })
  })
  .strip();

export type ManagePoolInput = {
  title: string;
  description: string;
  eventType: (typeof EVENT_TYPES)[number];
  closingDate: Date;
};

export function parseManagePoolFormValues(formData: FormData): ManagePoolFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventType: String(formData.get("eventType") ?? "") as ManagePoolFormValues["eventType"],
    closingDate: String(formData.get("closingDate") ?? "")
  };
}

export function validateManagePoolInput(
  values: ManagePoolFormValues,
  now: Date = new Date()
):
  | { success: true; data: ManagePoolInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof ManagePoolFormValues, string>>;
    } {
  const result = ManagePoolSchema.superRefine((value, ctx) => {
    if (!isClosingDateOnOrAfterToday(parseClosingDate(value.closingDate), now)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("validation.closingDateFuture"),
        path: ["closingDate"]
      });
    }
  }).safeParse(values);

  if (!result.success) {
    const flattened = result.error.flatten().fieldErrors;

    return {
      success: false,
      fieldErrors: {
        title: flattened.title?.[0],
        description: flattened.description?.[0],
        eventType: flattened.eventType?.[0],
        closingDate: flattened.closingDate?.[0]
      }
    };
  }

  return {
    success: true,
    data: {
      title: result.data.title,
      description: result.data.description,
      eventType: result.data.eventType,
      closingDate: parseClosingDate(result.data.closingDate)
    }
  };
}
