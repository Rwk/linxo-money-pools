import { fr } from "@/i18n/fr";

type TranslationTree = typeof fr;

type Join<K extends string, P extends string> = `${K}.${P}`;

type LeafPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : Join<K, LeafPaths<T[K]>>;
    }[keyof T & string];

type TranslationKey = LeafPaths<TranslationTree>;

type TranslationValues = Record<string, string | number>;

function lookupValue(path: string): string | undefined {
  const result = path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, fr);

  return typeof result === "string" ? result : undefined;
}

function interpolate(
  template: string,
  values?: TranslationValues
): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];

    return value === undefined ? `{{${key}}}` : String(value);
  });
}

export function t(key: TranslationKey, values?: TranslationValues): string {
  const template = lookupValue(key);

  if (!template) {
    return key;
  }

  return interpolate(template, values);
}
