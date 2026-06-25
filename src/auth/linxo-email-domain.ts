const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isLinxoEmail(
  email: string | null | undefined
): boolean {
  if (typeof email !== "string") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.length === 0 || !EMAIL_PATTERN.test(normalizedEmail)) {
    return false;
  }

  const [, domain] = normalizedEmail.split("@");

  return domain === "linxo.com";
}
