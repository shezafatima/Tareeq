import { cn } from "@/lib/utils";

type CardProps = {
  as?: "div" | "article" | "li";
  /** lifts on hover and keyboard focus (put it on the card, not on a Reveal wrapper) */
  lift?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Card({ as: Tag = "div", lift, className, children }: CardProps) {
  return <Tag className={cn("rounded-card border border-royal/10 bg-white p-6", lift && "lift", className)}>{children}</Tag>;
}
