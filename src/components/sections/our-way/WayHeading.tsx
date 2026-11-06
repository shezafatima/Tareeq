/** The oversized section heading on Our Way. It takes its colour from the section's tone. */
export default function WayHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="way-h2 font-heading font-bold">
      {children}
    </h2>
  );
}
