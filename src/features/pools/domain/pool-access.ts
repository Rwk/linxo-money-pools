export function canManagePool(
  authenticatedUserId: string,
  creatorId: string
): boolean {
  return authenticatedUserId === creatorId;
}
