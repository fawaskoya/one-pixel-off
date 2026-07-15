import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link className="brand-mark" href="/" aria-label="One Pixel Off home">
      <span className="brand-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <i data-offset={index === 5 ? "true" : "false"} key={index} />
        ))}
      </span>
      <span>{compact ? "Pixel Off" : "One Pixel Off"}</span>
    </Link>
  );
}
