/** Sample-style ghost rows for any admin table body.
 *  Same row-enter as the dashboard activity skeleton: opacity/y:10 → 0,
 *  .45s ease-out-cubic, 30ms stagger via --si (.wf-skel-row). */
export function TableRowsSkeleton({
  colSpan,
  rows = 6,
  label = "Loading rows",
}: {
  colSpan: number;
  rows?: number;
  label?: string;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td colSpan={colSpan} className="p-0" aria-hidden={i > 0}>
            <div
              className="wf-skel-row flex items-center gap-4 px-4 py-4"
              style={{ ["--si" as string]: i } as React.CSSProperties}
            >
              {i === 0 ? <span className="sr-only">{label}</span> : null}
              <span className="wf-skel-bar wf-skel-bar--box h-2.5 w-16 shrink-0" />
              <span className="wf-skel-bar wf-skel-bar--box h-2.5 flex-1" />
              <span className="wf-skel-bar wf-skel-bar--box h-2.5 w-20 shrink-0" />
              <span className="wf-skel-bar h-6 w-16 shrink-0" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
