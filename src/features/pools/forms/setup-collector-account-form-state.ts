export type SetupCollectorAccountFormValues = {
  accountHolderName: string;
  iban: string;
  entityType: "NATURAL_PERSON" | "COMPANY";
  firstName: string;
  surname: string;
  birthDate: string;
  birthCity: string;
  birthCountry: string;
  companyName: string;
  nationalIdentification: string;
  companyCountry: string;
};

export type SetupCollectorAccountActionState = {
  values: SetupCollectorAccountFormValues;
  fieldErrors: Partial<Record<keyof SetupCollectorAccountFormValues, string>>;
  formError: string | null;
};

export function getSetupCollectorAccountDefaultValues(): SetupCollectorAccountFormValues {
  return {
    accountHolderName: "",
    iban: "",
    entityType: "NATURAL_PERSON",
    firstName: "",
    surname: "",
    birthDate: "",
    birthCity: "",
    birthCountry: "",
    companyName: "",
    nationalIdentification: "",
    companyCountry: ""
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
      iban: "",
      firstName: "",
      surname: "",
      birthDate: "",
      birthCity: "",
      birthCountry: "",
      companyName: "",
      nationalIdentification: "",
      companyCountry: ""
    },
    fieldErrors: state?.fieldErrors ?? {},
    formError: state?.formError ?? null
  };
}
