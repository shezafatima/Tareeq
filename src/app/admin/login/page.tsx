import Image from "next/image";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { auth } from "@/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  // already signed in: go to the panel. If the admin settings are missing, still show the form (sign-in then says it is unavailable).
  const session = await auth().catch(() => null);
  if (session?.user) redirect("/admin");

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 h-full w-full"
          gradientBackgroundStart="var(--color-paper)"
          gradientBackgroundEnd="var(--color-soft)"
          firstColor="30, 58, 138"
          secondColor="37, 99, 235"
          thirdColor="230, 240, 255"
          fourthColor="242, 169, 59"
          fifthColor="13, 27, 61"
          pointerColor="37, 99, 235"
          blendingValue="soft-light"
          interactive={false}
        />
      </div>
      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10">
        <div className="admin-pop w-full max-w-sm rounded-3xl border border-white/70 bg-white/70 p-6 shadow-float backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Image src="/robot-head.png" alt="" width={64} height={64} className="h-16 w-16 object-contain" priority />
            <Image src="/logo-tareeq.png" alt="tareeq" width={480} height={127} className="h-7 w-auto" priority />
            <h1 className="font-heading text-xl font-bold text-midnight">Admin sign in</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
