"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useWorld } from "@/lib/useWorld";
import { setPanel, type PanelId } from "@/lib/world";
import { cn } from "@/lib/utils";

interface OverlayProps {
  id: Exclude<PanelId, null>;
  label: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, textarea, select';

/**
 * Full-screen overlay: dark backdrop, inner panel with grain. Traps focus while
 * open, closes on Escape or a backdrop click, and returns focus to the opener.
 */
const Overlay = ({ id, label, children, className, panelClassName }: OverlayProps) => {
  const { panel } = useWorld("panel");
  const open = panel === id;
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    document.documentElement.dataset.overlay = id;
    const el = root.current;
    const first = el?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPanel(null);
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.documentElement.dataset.overlay === id) delete document.documentElement.dataset.overlay;
      opener.current?.focus?.({ preventScroll: true });
    };
  }, [open, id]);

  return (
    <div
      ref={root}
      id={`overlay-${id}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      hidden={!open}
      className={cn("overlay fixed inset-0 z-[90] bg-black/60 lg:p-edge", className)}
      onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}
    >
      {open && (
        <div
          data-lenis-prevent
          className={cn("overlay-panel relative h-full w-full overflow-y-auto overscroll-contain bg-panel", panelClassName)}
        >
          <div aria-hidden className="noise pointer-events-none fixed inset-0 lg:absolute" />
          <div className="relative">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Overlay;
