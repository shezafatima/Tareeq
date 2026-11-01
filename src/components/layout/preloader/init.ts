// The preloader's page logic. It is a plain function, type-checked here and serialised into an inline script
// (see PreloaderScript) so it runs before the first paint. It must stay self-contained: no imports and no
// references to anything outside the function. Values it needs are passed in through PRELOADER_CONFIG.
//
// State lives on <html data-preloader>: absent (hidden), run (showing), leave (fading out), done (hidden).
// The CSS (preloader.css) plays the 6 s sequence and fades the overlay out on its own (done by 6.2 s), so the overlay
// cannot outlive that even if this script fails. This script decides whether to show it at all (the skip rules, so
// there is never a flash), sets the state, and, only if config.earlyFinish is on, ends the sequence early when the
// page has loaded.

// Development only: why the preloader showed or was skipped, written to the console. In a production build this
// object is empty, so none of the text is shipped in the page.
const MESSAGES: Record<string, string> =
  process.env.NODE_ENV !== "production"
    ? {
        show: "showing for 6 s (on every load)",
        preview: "review preview, skip rules bypassed, length:",
        reduced: "skipped: this device asks for reduced motion (turn off reduce motion in the OS, or add ?preloader-preview to the address to see it anyway)",
        slow: "skipped: slow connection or data saver; add ?preloader-preview to the address to see it anyway. Reported:",
        seen: "skipped: already shown in this browser session (open a private window, or add ?preloader-preview to the address)",
        error: "skipped: session storage is blocked or something unexpected happened",
      }
    : {};

export const PRELOADER_CONFIG = {
  sequenceMs: 6000, // length of the animation; must match --pl-seq in the CSS
  fadeMs: 300, // fade out; must match the CSS
  failSafeMs: 5900, // when the CSS-only fade starts on its own (sequence minus 0.1 s); must match the CSS
  earlyFinish: false, // owner's decision: stay on screen for the full 6 s. Set true to end early when the page has loaded
  fastForwardMs: 80, // early finish only: time to speed the sequence up to its last stretch
  lastStretchMs: 600, // early finish only: the final stretch of the sequence (the last chevron brightens)
  backupMs: 7000, // forces the hidden state if nothing else has
  previewSeconds: 10, // review-only: length of the sequence when the URL has ?preloader-preview
  oncePerSession: false, // owner's decision: show on every load and refresh. Set true to show once per browser session
  flagKey: "tareeq:preloader-seen", // oncePerSession only: sessionStorage key, set when the overlay is shown
  messages: MESSAGES,
} as const;

type PreloaderConfig = typeof PRELOADER_CONFIG;

function initPreloader(config: PreloaderConfig): void {
  const root = document.documentElement;
  const state = () => root.getAttribute("data-preloader");
  const set = (value: string) => root.setAttribute("data-preloader", value);
  const say = (key: string, extra?: string) => {
    const message = config.messages[key];
    if (message) console.info("[preloader] " + message + (extra ? " " + extra : ""));
  };

  try {
    // Review-only preview: ?preloader-preview (10 s) or ?preloader-preview=15 stretches the whole sequence so it can be
    // watched properly, bypasses the skip rules, and turns off the early finish. Normal visits never have this parameter.
    const found = /[?&]preloader-preview(?:=([0-9.]+))?/.exec(location.search);
    let preview = 0;
    if (found) {
      const asked = found[1] ? parseFloat(found[1]) : config.previewSeconds;
      preview = Math.min(60, Math.max(2, isNaN(asked) ? config.previewSeconds : asked));
      root.style.setProperty("--pl-seq", preview * 1000 + "ms");
      root.setAttribute("data-preloader-preview", ""); // lets the CSS show it even when reduced motion is on
      say("preview", preview + " s");
    } else {
      // Skip rules. Skipping means leaving data-preloader unset, so the overlay is never drawn, not even for a frame.
      // 1. The visitor asked for reduced motion
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        say("reduced");
        return;
      }
      // 2. Slow connection or data saver (where the browser reports it; if it does not, the preloader is allowed)
      const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (net && (net.saveData || /^(slow-2g|2g|3g)$/.test(String(net.effectiveType)))) {
        say("slow", net.saveData ? "data saver on" : "connection " + net.effectiveType);
        return;
      }
      // 3. Already seen in this browser session (only when oncePerSession is on; if storage is blocked this throws
      //    and the catch below skips too). Off by default: the preloader shows on every load and refresh.
      if (config.oncePerSession) {
        if (sessionStorage.getItem(config.flagKey)) {
          say("seen");
          return;
        }
        sessionStorage.setItem(config.flagKey, "1");
      }
      say("show");
    }

    set("run");

    const done = () => set("done");
    const leave = () => {
      if (state() === "run") set("leave");
    };

    // The overlay's own animations other than its fade: eyes, chevron fill, last chevron
    const sequence = (el: HTMLElement) =>
      el.getAnimations({ subtree: true }).filter((a) => a.effect && (a.effect as KeyframeEffect).target !== el);

    const finishEarly = () => {
      try {
        if (state() !== "run") return;
        const el = document.getElementById("preloader");
        if (!el || typeof el.getAnimations !== "function") return leave();
        const anims = sequence(el);
        const elapsed = anims.length ? Number(anims[0].currentTime) || 0 : config.sequenceMs;
        // The CSS fade has already started on its own. Leave it alone; restarting it would flash.
        if (elapsed >= config.failSafeMs - 5) return;
        const lastStretchStart = config.sequenceMs - config.lastStretchMs;
        if (elapsed >= lastStretchStart) return leave(); // only the last-chevron pulse is left: fade while it plays
        // Start the fade now (it runs off the main thread, so page work cannot delay it) and speed the sequence up
        // to the start of its last stretch; then the last chevron pulses at double speed while the fade finishes.
        const rate = Math.max(1, (lastStretchStart - elapsed) / config.fastForwardMs);
        anims.forEach((a) => a.updatePlaybackRate(rate));
        leave();
        setTimeout(() => anims.forEach((a) => a.updatePlaybackRate(2)), config.fastForwardMs);
      } catch {
        leave();
      }
    };

    // Hide for good when a fade ends (either fade), or after a backup time
    const watchFade = () => {
      const el = document.getElementById("preloader");
      if (!el) return;
      el.addEventListener("animationend", (e) => {
        if (e.target === el && (e.animationName === "preloader-out" || e.animationName === "preloader-leave")) done();
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchFade);
    else watchFade();

    if (preview) {
      setTimeout(done, preview * 1000 + config.fadeMs + 500);
    } else {
      if (config.earlyFinish) {
        if (document.readyState === "complete") finishEarly();
        else window.addEventListener("load", finishEarly);
      }
      setTimeout(done, config.backupMs);
    }
    // A page restored from the back/forward cache must not replay it
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) done();
    });
  } catch {
    // Anything unexpected (for example storage blocked): skip, leave the page as it is, never throw
    try {
      say("error");
      set("done");
    } catch {
      // nothing more can be done
    }
  }
}

export const PRELOADER_SCRIPT = "(" + initPreloader.toString() + ")(" + JSON.stringify(PRELOADER_CONFIG) + ")";
