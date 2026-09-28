import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import "@/app/globals.css";

import Header from "@/components/hud/Header";
import SiteMenu from "@/components/hud/SiteMenu";
import SoundEngine from "@/components/hud/SoundEngine";
import { profile, socials } from "@/constants";

/** One variable family for everything; the width axis gives the extended display look. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const description =
  "Logesh Kumar is a Software Development Engineer building backend systems: Python, Django and FastAPI services, microservices, event-driven architecture and data synchronization.";
const title = `${profile.name} | ${profile.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: { default: title, template: `%s | ${profile.name}` },
  description,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: profile.site }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: profile.site,
    title,
    description,
    siteName: profile.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@zxlogi",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "dark",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: profile.site,
  jobTitle: profile.role,
  worksFor: { "@type": "Organization", name: "Cyces Innovation Labs LLP" },
  address: { "@type": "PostalAddress", addressRegion: "Tamil Nadu", addressCountry: "IN" },
  sameAs: socials.map((s) => s.href),
  knowsAbout: [
    "Python", "Django", "FastAPI", "PostgreSQL", "Redis", "RabbitMQ", "Celery",
    "Microservices", "Event-driven architecture", "System design", "React", "React Native",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="black" className={archivo.variable}>
      <head>
        {/* Mark JS before paint: loader and reveal effects only apply when scripts run. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var d=document.documentElement;d.classList.add('js');if(location.pathname==='/')d.dataset.booting='1'",
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Header />
        <SiteMenu />
        <SoundEngine />
        <div id="main">{children}</div>
        <div aria-hidden className="noise pointer-events-none fixed inset-0 z-[85]" />
        <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-[2]" />
        <Analytics />
      </body>
    </html>
  );
}
