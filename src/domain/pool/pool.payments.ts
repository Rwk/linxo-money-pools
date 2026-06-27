export function isPoolReadyForPayments(input: {
  status: "OPEN" | "CLOSED";
  collectorAliasId: string | null;
}): boolean {
  return input.status === "OPEN" && input.collectorAliasId !== null;
}
