import Link from "next/link";

import { moreLinks, profile } from "@/constants";

const SiteFooter = () => (
  <footer className="relative z-[2] border-t border-line/10 bg-ink/80 pb-16 backdrop-blur">
    <div className="container flex flex-col gap-6 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <p className="font-mono text-xs">
        © {new Date().getFullYear()} {profile.name} · {profile.location}
      </p>
      <nav aria-label="More">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {moreLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link-underline hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={profile.resume} className="link-underline hover:text-fg" target="_blank" rel="noopener">
              Resume
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
);

export default SiteFooter;
