import { cn } from "@/lib/utils";

type CardProps = {
  as?: "div" | "article" | "li";
  className?: string;
  children: React.ReactNode;
};

export default function Card({ as: Tag = "div", className, children }: CardProps) {
  return <Tag className={cn("rounded-card border border-royal/10 bg-white p-6", className)}>{children}</Tag>;
}
