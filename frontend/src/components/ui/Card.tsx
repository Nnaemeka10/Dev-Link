import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm md:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
