/** A section's marker on the path. Filled by default; CSS empties it only while the scroll drawing is able to fill it. */
export default function WayNode() {
  return (
    <span aria-hidden="true" data-way-node="" className="way-node">
      <span className="way-node-dot" />
    </span>
  );
}
