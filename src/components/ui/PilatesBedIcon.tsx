/**
 * A stylized top-down reformer/mat shape — a long padded body with a headrest and
 * footbar cap at each end — instead of a plain numbered square, so the room layout
 * builder and spot pickers actually look like the studio floor they represent.
 */
export function PilatesBedIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 40" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="7" width="18" height="26" rx="5" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.15 : undefined} />
      <path d="M8 7V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 4v3" strokeLinecap="round" />
      <path d="M8 33v3a1.5 1.5 0 0 0 1.5 1.5h5a1.5 1.5 0 0 0 1.5-1.5v-3" strokeLinecap="round" />
    </svg>
  );
}
