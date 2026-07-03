function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeTextForLinxo(value: string): string {
  return normalizeWhitespace(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u00B4`]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/[^\x20-\x7E]/g, " ")
  );
}
