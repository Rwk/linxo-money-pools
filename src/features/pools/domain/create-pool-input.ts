import { z } from "zod";

import { EVENT_TYPES } from "@/domain/pool/pool.types";
import type { CreatePoolFormValues } from "@/features/pools/forms/create-pool-form-state";
import { t } from "@/i18n/t";

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
      }),
    collectorDisplayName: z
      .string()
      .trim()
      .min(1, t("validation.collectorDisplayNameRequired"))
      .max(
        COLLECTOR_DISPLAY_NAME_MAX_LENGTH,
        t("validation.collectorDisplayNameMax", {
          count: COLLECTOR_DISPLAY_NAME_MAX_LENGTH
        })
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
