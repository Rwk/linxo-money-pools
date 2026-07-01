import { PropsWithChildren } from "react";

export type StatusBadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

type StatusBadgeSize = "sm" | "md";

type StatusBadgeProps = PropsWithChildren<{
  size?: StatusBadgeSize;
  variant: StatusBadgeVariant;
}>;

const variantClasses: Record<StatusBadgeVariant, string> = {
  success:
    "border-[color:var(--success-border)] bg-[color:var(--success-surface)] text-[color:var(--success)]",
  danger:
    "border-[color:var(--danger-border)] bg-[color:var(--danger-surface)] text-[color:var(--danger)]",
  warning:
    "border-[color:var(--warning-border)] bg-[color:var(--warning-surface)] text-[color:var(--warning)]",
  info:
    "border-[color:var(--info-border)] bg-[color:var(--info-surface)] text-[color:var(--info)]",
  neutral:
    "border-[color:var(--neutral-border)] bg-[color:var(--neutral-surface)] text-[color:var(--neutral)]"
};

const sizeClasses: Record<StatusBadgeSize, string> = {
  sm: "px-2.5 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs"
};

export function StatusBadge({
  children,
  size = "md",
  variant
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.12em] ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
