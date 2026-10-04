/** Small inline icons used by the HUD. All are decorative (aria-hidden). */

type P = { className?: string };

export const IconArrow = ({ className }: P) => (
  <svg viewBox="0 0 10 10" className={className} aria-hidden fill="currentColor">
    <path d="M1.5 0h8.5v8.5H8.4V2.7L1.1 10 0 8.9 7.3 1.6H1.5z" />
  </svg>
);

export const IconTimeline = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
    <circle cx="3" cy="3" r="2" />
    <circle cx="3" cy="13" r="2" />
    <path d="M2.3 5h1.4v6H2.3zM7 2h8v2H7zm0 10h8v2H7zm0-5h6v2H7z" />
  </svg>
);

export const IconUser = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
    <circle cx="8" cy="5" r="3.2" />
    <path d="M1.5 15c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5z" />
  </svg>
);

export const IconClose = ({ className }: P) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden fill="currentColor">
    <path d="M1.1 0 6 4.9 10.9 0 12 1.1 7.1 6 12 10.9 10.9 12 6 7.1 1.1 12 0 10.9 4.9 6 0 1.1z" />
  </svg>
);

export const IconSwap = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
    <path d="M11 1l4 3.5L11 8V5.5H2V3.5h9zM5 8v2.5h9v2H5V15l-4-3.5z" />
  </svg>
);

export const Burger = ({ open }: { open: boolean }) => (
  <span aria-hidden className="relative block h-2.5 w-[18px]">
    <span className={`absolute left-0 top-0 h-[2px] w-full bg-current transition-transform duration-500 ease-out ${open ? "translate-y-[4px] rotate-45" : ""}`} />
    <span className={`absolute bottom-0 left-0 h-[2px] w-full bg-current transition-transform duration-500 ease-out ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
  </span>
);
