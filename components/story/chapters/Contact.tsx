import type { CSSProperties } from "react";

import { SocialIcon } from "@/components/site";
import { profile, socials } from "@/constants";

import Beat from "../Beat";
import Heading from "../Heading";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

const Contact = () => (
  <section id="contact" data-chapter="contact" aria-labelledby="contact-title">
    <Beat id="contact" side="left">
      <Heading index="06" eyebrow="Contact" id="contact-title" lines={["Have a system", "to build?", <span key="t" className="text-signal">Let&apos;s talk.</span>]} />
      <a
        href={`mailto:${profile.email}`}
        className="rv group mt-8 inline-flex max-w-full items-center gap-3 break-all font-display text-[clamp(1.1rem,2.6vw,1.8rem)] font-light"
        style={i(4)}
      >
        <span className="link-underline">{profile.email}</span>
        <span aria-hidden className="text-signal transition-transform duration-500 group-hover:translate-x-1">
          →
        </span>
      </a>
      <p className="rv mt-3 font-mono text-xs text-muted" style={i(4)}>
        <a href={profile.phoneHref} className="link-underline hover:text-fg">
          {profile.phone}
        </a>{" "}
        · {profile.location}
      </p>
      <ul className="rv mt-7 flex flex-wrap gap-2" style={i(5)}>
        {socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="hud-pill" data-cursor-label={s.handle}>
              <SocialIcon icon={s.icon} className="text-sm" />
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <a href={profile.resume} target="_blank" rel="noopener" className="rv hud-pill hud-pill--solid mt-6" style={i(6)}>
        Download resume <span aria-hidden>↗</span>
      </a>
    </Beat>
  </section>
);

export default Contact;
