import Image from "next/image";
import Link from "next/link";

/** The tareeq wordmark for the admin shell (light version, for the navy surfaces). Links to the admin home. */
export default function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <Link href="/admin" aria-label="tareeq admin, home" className="flex min-h-11 items-center">
      <Image src="/logo-tareeq-light.png" alt="" width={480} height={127} className={`w-auto ${className}`} priority />
    </Link>
  );
}
