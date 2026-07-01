import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--accent-hover)]",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] ring-1 ring-[var(--surface-border)] hover:bg-[var(--surface-strong)]",
  danger:
    "bg-[var(--danger)] text-white shadow-[0_14px_28px_rgba(194,69,69,0.18)] hover:bg-[#ab3939]"
};

export function Button({
  className = "",
  disabled = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    />
  );
}
