import { PRELOADER_SCRIPT } from "./init";

// Inline on purpose: it has to run before the first paint to decide whether the preloader shows at all.
export default function PreloaderScript() {
  return <script dangerouslySetInnerHTML={{ __html: PRELOADER_SCRIPT }} />;
}
