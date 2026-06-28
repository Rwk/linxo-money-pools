export type RefreshPoolContributionStatusesSummary = {
  checkedCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
};

export type RefreshPoolContributionStatusesActionState = {
  formError: string | null;
  successMessage: string | null;
  summary: RefreshPoolContributionStatusesSummary | null;
};

export function getInitialRefreshPoolContributionStatusesActionState(): RefreshPoolContributionStatusesActionState {
  return {
    formError: null,
    successMessage: null,
    summary: null
  };
}

export const initialRefreshPoolContributionStatusesActionState =
  getInitialRefreshPoolContributionStatusesActionState();

export function normalizeRefreshPoolContributionStatusesActionState(
  state: Partial<RefreshPoolContributionStatusesActionState> | undefined
): RefreshPoolContributionStatusesActionState {
  return {
    formError: state?.formError ?? null,
    successMessage: state?.successMessage ?? null,
    summary: state?.summary ?? null
  };
}
