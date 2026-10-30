import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";
import { joinHref } from "@/lib/site";
import DesktopNav from "./DesktopNav";
import Logo from "./Logo";
import MobileMenuContent from "./MobileMenuContent";
import MobileNav from "./MobileNav";

// Height comes from --header-h (globals.css); the hero sizes itself against it.
export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-midnight/10 bg-paper/90 backdrop-blur">
      <Container className="flex h-full items-center justify-between gap-4">
        <Logo />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <Button href={joinHref} className="hidden sm:inline-flex">
            Book a workshop
            <ChevronRight />
          </Button>
          <MobileNav>
            <MobileMenuContent />
          </MobileNav>
        </div>
      </Container>
    </header>
  );
}
