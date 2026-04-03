import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "primary" | "secondary" | "danger" | "dangerSoft" | "ghost";

type ActionButtonSize = "sm" | "md";

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  icon?: ReactNode;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-600 hover:border-red-400 hover:text-red-700",
  dangerSoft: "border border-red-300 bg-red-100 text-red-700 hover:bg-red-200",
  ghost: "border border-transparent bg-transparent text-slate-700 hover:text-slate-900",
};

const sizeClasses: Record<ActionButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

export default function ActionButton({
  label,
  icon,
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
