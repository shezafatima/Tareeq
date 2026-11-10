import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { signOutAction } from "@/app/admin/login/actions";

/** The Log out nav item: a form that posts the sign-out action (works without client JavaScript). */
export default function LogoutForm() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex h-11 w-full items-center gap-3 rounded-xl pl-4 pr-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <SignOut weight="duotone" size={22} aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}
