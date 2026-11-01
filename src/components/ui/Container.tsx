import { cn } from "@/lib/utils";

type ContainerProps = {
  as?: "div" | "section" | "header" | "footer";
  className?: string;
  children: React.ReactNode;
};

export default function Container({ as: Tag = "div", className, children }: ContainerProps) {
  return <Tag className={cn("mx-auto w-full max-w-7xl px-gutter sm:px-8", className)}>{children}</Tag>;
}
