import { ReactNode } from "react";

import "@/app/globals.css";

import { Analytics } from "@vercel/analytics/react";

import { Poppins } from "next/font/google";
// components
import { Header, Navbar } from "@/components/shared";

// containers
import { ThemeProvider } from "@/containers";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-poppins",
});

export const metadata = {
  title: "Logesh Kumar",
  description:
    "Logesh Kumar is a  developer based in India. He is a full stack developer and has worked on multiple projects.",
};

export default function RootLayout({
  children,
  pageTitle,
}: {
  children: ReactNode;
  pageTitle: string;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css" /> 
      </head>
      <body
        className={`bg-gradient-light dark:bg-gradient min-h-screen text-dark dark:text-light transition-opacity duration-500 ${poppins.variable}`}
      >
        <ThemeProvider>
          <Header />

          <Analytics />

          <Navbar />

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
