import { z } from "zod";

import { EVENT_TYPES } from "@/domain/pool/pool.types";
import type { CreatePoolFormValues } from "@/features/pools/forms/create-pool-form-state";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;
const COLLECTOR_DISPLAY_NAME_MAX_LENGTH = 120;

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseClosingDate(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

export function isClosingDateOnOrAfterToday(
  value: string,
  now: Date = new Date()
): boolean {
  return value >= getLocalDateString(now);
}

const CreatePoolSchema = z
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
      }),
    collectorDisplayName: z
      .string()
      .trim()
      .min(1, "Collector display name is required.")
      .max(
        COLLECTOR_DISPLAY_NAME_MAX_LENGTH,
        `Collector display name must be ${COLLECTOR_DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
      )
  })
  .strip();

export type CreatePoolInput = {
  title: string;
  description: string;
  eventType: (typeof EVENT_TYPES)[number];
  closingDate: Date;
  collectorDisplayName: string;
};

export function parseCreatePoolFormValues(
  formData: FormData
): CreatePoolFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    eventType: String(formData.get("eventType") ?? "") as CreatePoolFormValues["eventType"],
    closingDate: String(formData.get("closingDate") ?? ""),
    collectorDisplayName: String(formData.get("collectorDisplayName") ?? "")
  };
}

export function validateCreatePoolInput(
  values: CreatePoolFormValues,
  now: Date = new Date()
):
  | { success: true; data: CreatePoolInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof CreatePoolFormValues, string>>;
    } {
  const result = CreatePoolSchema.superRefine((value, ctx) => {
    if (!isClosingDateOnOrAfterToday(value.closingDate, now)) {
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
        closingDate: flattened.closingDate?.[0],
        collectorDisplayName: flattened.collectorDisplayName?.[0]
      }
    };
  }

  return {
    success: true,
    data: {
      title: result.data.title,
      description: result.data.description,
      eventType: result.data.eventType,
      closingDate: parseClosingDate(result.data.closingDate),
      collectorDisplayName: result.data.collectorDisplayName
    }
  };
}
