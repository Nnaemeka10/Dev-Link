import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-white hover:brightness-95",
  secondary: "border border-text-primary/20 bg-white text-text-primary hover:bg-bg-secondary",
  ghost: "bg-transparent text-text-primary hover:bg-text-primary/5",
};

const sizeClass: Record<ButtonSize, string> = {
  xs: "px-4 py-1.5 text-xs font-medium",
  sm: "px-5 py-2 text-sm font-medium",
  md: "px-6 py-2 text-sm font-medium",
  lg: "px-8 py-3 text-base font-semibold",
};

export default function Button({
  children,
  className = "",
  iconLeft,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[1.2rem] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {iconLeft}
      {children}
    </button>
  );
}
