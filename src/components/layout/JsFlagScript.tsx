// Inline on purpose: marks <html data-js> before the first paint, so CSS can choose layouts that need JavaScript
// (for example the travelling "How it works" stage) without a jump after hydration. Without JavaScript the
// attribute never appears and the plain layouts are shown.
export default function JsFlagScript() {
  return <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.setAttribute("data-js","")' }} />;
}
