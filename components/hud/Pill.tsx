import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PillProps {
  label: ReactNode;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  /** Stagger for the scale-in, in seconds. */
  delay?: number;
  solid?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Label pill with a round icon (docs/design-spec.md §3.1). The background disc and
 * the icon disc scale in on mount; hover swaps the icon to the accent.
 */
const Pill = ({ label, icon, href, onClick, external, delay = 0, solid, className, ariaLabel }: PillProps) => {
  const style = { "--d": `${delay}s` } as CSSProperties;
  const cls = cn("pill", solid && "pill-solid", className);
  const inner = (
    <>
      <span>{label}</span>
      <span className="pill-icon">{icon}</span>
    </>
  );
  if (href && external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  if (href)
    return (
      <Link href={href} className={cls} style={style} aria-label={ariaLabel} onClick={onClick}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls} style={style} aria-label={ariaLabel}>
      {inner}
    </button>
  );
};

export default Pill;
