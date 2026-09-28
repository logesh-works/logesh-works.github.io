import Link from "next/link";

import SoundToggle from "@/components/hud/SoundToggle";
import { moreLinks, profile } from "@/constants";

/** Compact footer for the secondary pages (blog, activity, memories). */
const SiteFooter = () => (
  <footer className="border-t border-white/10 px-edge">
    <div className="t-micro flex flex-col items-center gap-5 py-10 text-fg/40 lg:flex-row">
      <p>© {new Date().getFullYear()} · {profile.name}</p>
      <nav aria-label="More" className="lg:ml-auto">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          <li>
            <Link href="/" className="text-signal transition-colors hover:text-fg">
              Home
            </Link>
          </li>
          {moreLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-signal transition-colors hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={profile.resume} target="_blank" rel="noopener" className="text-signal transition-colors hover:text-fg">
              Resume
            </a>
          </li>
        </ul>
      </nav>
      <SoundToggle />
    </div>
  </footer>
);

export default SiteFooter;
