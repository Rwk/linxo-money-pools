import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "tertiary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] disabled:hover:bg-[var(--accent)]",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)] disabled:hover:bg-[var(--secondary)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] disabled:hover:bg-[var(--danger)]",
  tertiary:
    "bg-transparent text-[var(--accent)] hover:bg-[var(--secondary)] disabled:hover:bg-transparent"
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = ""
): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`;
}

export function Button({
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={disabled}
      type={type}
      {...props}
    />
  );
}
