// A field real visitors never see or reach: it is moved off the screen, hidden from screen readers and skipped by
// Tab. Bots that fill in every field fill it too, and the server then drops the submission quietly.
// (Not display: none, so bots still treat it as a normal field.)
export default function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
