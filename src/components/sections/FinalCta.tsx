import CtaBand from "@/components/sections/CtaBand";
import { getHomeCopy } from "@/content";

export default async function FinalCta() {
  const { cta } = await getHomeCopy();
  return <CtaBand line={cta.line} label={cta.label} href={cta.href} />;
}
