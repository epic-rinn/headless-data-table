import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover border border-transparent",
  secondary:
    "bg-surface text-text-primary border border-border-strong hover:bg-row-hover",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:bg-row-hover hover:text-text-primary",
  danger:
    "bg-transparent text-stop border border-border-strong hover:bg-stop-tint",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-2xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  children?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconPosition = "start",
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconNode = Icon ? (
    <Icon size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden />
  ) : null;

  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {iconPosition === "start" ? iconNode : null}
      {children}
      {iconPosition === "end" ? iconNode : null}
    </button>
  );
}

type IconButtonProps = Omit<ButtonProps, "children" | "icon"> & {
  icon: LucideIcon;
  label: string;
};

export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT[variant],
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      {...rest}
    >
      <Icon size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
