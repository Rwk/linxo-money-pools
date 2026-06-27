export type SetupCollectorAccountFormValues = {
  accountHolderName: string;
  iban: string;
};

export type SetupCollectorAccountActionState = {
  values: SetupCollectorAccountFormValues;
  fieldErrors: Partial<Record<keyof SetupCollectorAccountFormValues, string>>;
  formError: string | null;
};

export function getSetupCollectorAccountDefaultValues(): SetupCollectorAccountFormValues {
  return {
    accountHolderName: "",
    iban: ""
  };
}

export function getInitialSetupCollectorAccountFormState(): SetupCollectorAccountActionState {
  return {
    values: getSetupCollectorAccountDefaultValues(),
    fieldErrors: {},
    formError: null
  };
}

export const initialSetupCollectorAccountActionState =
  getInitialSetupCollectorAccountFormState();

export function normalizeSetupCollectorAccountFormState(
  state: Partial<SetupCollectorAccountActionState> | undefined
): SetupCollectorAccountActionState {
  return {
    values: {
      ...getSetupCollectorAccountDefaultValues(),
      ...(state?.values ?? {}),
      iban: ""
    },
    fieldErrors: state?.fieldErrors ?? {},
    formError: state?.formError ?? null
  };
}
