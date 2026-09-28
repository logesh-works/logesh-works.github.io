import type { Metadata } from "next";

import Gallery from "@/components/pages/Gallery";
import { SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: "Memories",
};

const MemoriesPage = () => (
  <main className="container pb-24 pt-32 md:pt-40">
    <SectionHeading as="h1" index="//" label="Off the clock" title="Memories" />
    <Gallery />
  </main>
);

export default MemoriesPage;
