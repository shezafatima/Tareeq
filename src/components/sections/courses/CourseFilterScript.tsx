import { LEVELS } from "@/lib/courses/options";

// Inline on purpose: applies ?category= and ?level= before the first paint, so a shared link never flashes other courses
// while the page loads. CourseFilter takes over after hydration. Without JavaScript this never runs and every course shows.
export default function CourseFilterScript({ listId, categorySlugs }: { listId: string; categorySlugs: string[] }) {
  const script = `(function(){var q=new URLSearchParams(location.search),c=q.get("category"),l=q.get("level");if(${JSON.stringify(
    categorySlugs,
  )}.indexOf(c)<0)c=null;if(${JSON.stringify(LEVELS)}.indexOf(l)<0)l=null;if(!c&&!l)return;var u=document.getElementById(${JSON.stringify(
    listId,
  )});if(!u)return;for(var i=0;i<u.children.length;i++){var e=u.children[i];if((c&&e.getAttribute("data-category")!==c)||(l&&e.getAttribute("data-level")!==l))e.hidden=true}})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
