import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill font-semibold transition-colors";
const variants = {
  primary: "bg-midnight text-white hover:bg-royal",
  secondary: "border border-midnight/70 text-midnight hover:bg-midnight/5",
};
const sizes = {
  md: "px-4 py-2 text-sm sm:px-5 sm:py-2.5",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({ variant = "primary", size = "md", href, className, children, ...rest }: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
