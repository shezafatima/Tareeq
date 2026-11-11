import { cn } from "@/lib/utils";

/**
 * The dashboard's single H1 ("Good morning, Sheza") and today's date, both worked out on the server in Karachi time.
 * A slim midnight-to-royal banner with a saffron edge; the text is white on the dark side of the gradient (AA contrast).
 */
export default function Greeting({ greeting, name, date, className }: { greeting: string; name: string; date: string; className?: string }) {
  return (
    <header
      className={cn(
        "dash-rise relative flex flex-col justify-center overflow-hidden rounded-2xl bg-linear-to-br from-midnight to-royal px-5 py-3 text-white shadow-card-rest",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-saffron" />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">
        {greeting}, {name}
      </h1>
      <p className="text-sm text-white/80">{date}</p>
    </header>
  );
}
