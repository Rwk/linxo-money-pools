export type CreatePoolFormValues = {
  title: string;
  description: string;
  eventType: "BIRTHDAY" | "BIRTH" | "WEDDING" | "FAREWELL" | "OTHER";
  closingDate: string;
  collectorDisplayName: string;
};

export type CreatePoolActionState = {
  values: CreatePoolFormValues;
  fieldErrors: Partial<Record<keyof CreatePoolFormValues, string>>;
  formError: string | null;
};

export function getCreatePoolDefaultValues(): CreatePoolFormValues {
  return {
    title: "",
    description: "",
    eventType: "BIRTHDAY",
    closingDate: "",
    collectorDisplayName: ""
  };
}

export function getInitialCreatePoolFormState(): CreatePoolActionState {
  return {
    values: getCreatePoolDefaultValues(),
    fieldErrors: {},
    formError: null
  };
}

export const initialCreatePoolActionState = getInitialCreatePoolFormState();

export function normalizeCreatePoolFormState(
  state: Partial<CreatePoolActionState> | undefined
): CreatePoolActionState {
  return {
    values: {
      ...getCreatePoolDefaultValues(),
      ...(state?.values ?? {})
    },
    fieldErrors: state?.fieldErrors ?? {},
    formError: state?.formError ?? null
  };
}
