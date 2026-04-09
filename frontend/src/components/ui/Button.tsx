import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  iconLeft?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-white hover:brightness-95",
  secondary: "border border-text-primary/20 bg-white text-text-primary hover:bg-bg-secondary",
  ghost: "bg-transparent text-text-primary hover:bg-text-primary/5",
};

export default function Button({
  children,
  className = "",
  iconLeft,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {iconLeft}
      {children}
    </button>
  );
}
