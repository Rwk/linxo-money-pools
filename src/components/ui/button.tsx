import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)]",
  secondary: "bg-white/70 text-slate-900 ring-1 ring-slate-900/10"
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
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      type={type}
      {...props}
    />
  );
}
