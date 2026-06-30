import { z } from "zod";

import { EVENT_TYPES } from "@/domain/pool/pool.types";
import {
  isClosingDateOnOrAfterToday
} from "@/domain/pool/pool.rules";
import type { ManagePoolFormValues } from "@/features/pools/forms/manage-pool-form-state";

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
      .min(1, "Title is required.")
      .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`),
    description: z
      .string()
      .trim()
      .min(1, "Description is required.")
      .max(
        DESCRIPTION_MAX_LENGTH,
        `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
      ),
    eventType: z.enum(EVENT_TYPES, {
      message: "Event type is required."
    }),
    closingDate: z
      .string()
      .min(1, "Closing date is required.")
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: "Closing date must use the YYYY-MM-DD format."
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
        message: "Closing date must be today or later.",
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
