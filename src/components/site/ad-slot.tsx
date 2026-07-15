type AdSlotProps = {
  label?: string;
  className?: string;
};

/**
 * A layout-stable monetization boundary. It intentionally renders nothing
 * until a real publisher ID, reviewed placement, and consent flow exist.
 */
export function AdSlot({ label = "Advertisement", className = "" }: AdSlotProps) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  if (!enabled) {
    return null;
  }

  return (
    <aside className={`ad-slot ${className}`.trim()} aria-label={label}>
      <span className="ad-slot__label">{label}</span>
      <div className="ad-slot__reserved" data-ad-slot-pending-review />
    </aside>
  );
}
