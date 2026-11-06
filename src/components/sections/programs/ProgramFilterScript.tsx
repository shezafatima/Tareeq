import { FILTER_VALUES } from "@/lib/programs/options";

// Inline on purpose: applies ?for= before the first paint, so a shared link never flashes other programs while the
// page loads. ProgramFilter takes over after hydration. Without JavaScript this never runs and every program shows.
export default function ProgramFilterScript({ listId }: { listId: string }) {
  const values = JSON.stringify(FILTER_VALUES.filter((v) => v !== "all"));
  const script = `(function(){var v=new URLSearchParams(location.search).get("for");if(${values}.indexOf(v)>-1)document.getElementById(${JSON.stringify(listId)}).setAttribute("data-active",v)})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
