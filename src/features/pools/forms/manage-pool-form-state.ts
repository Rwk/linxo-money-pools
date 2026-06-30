import type { EventType } from "@/domain/pool/pool.types";

export type ManagePoolFormValues = {
  title: string;
  description: string;
  eventType: EventType;
  closingDate: string;
};

export type ManagePoolActionState = {
  values: ManagePoolFormValues;
  fieldErrors: Partial<Record<keyof ManagePoolFormValues, string>>;
  formError: string | null;
  successMessage: string | null;
};

export function getManagePoolDefaultValues(
  values?: Partial<ManagePoolFormValues>
): ManagePoolFormValues {
  return {
    title: values?.title ?? "",
    description: values?.description ?? "",
    eventType: values?.eventType ?? "BIRTHDAY",
    closingDate: values?.closingDate ?? ""
  };
}

export function getInitialManagePoolActionState(
  values?: Partial<ManagePoolFormValues>
): ManagePoolActionState {
  return {
    values: getManagePoolDefaultValues(values),
    fieldErrors: {},
    formError: null,
    successMessage: null
  };
}

export function normalizeManagePoolFormState(
  initialValues: ManagePoolFormValues,
  state: Partial<ManagePoolActionState> | undefined
): ManagePoolActionState {
  return {
    values: {
      ...initialValues,
      ...(state?.values ?? {})
    },
    fieldErrors: state?.fieldErrors ?? {},
    formError: state?.formError ?? null,
    successMessage: state?.successMessage ?? null
  };
}
