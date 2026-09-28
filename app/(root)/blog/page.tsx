import type { Metadata } from "next";

import BlogList from "@/components/pages/BlogList";
import { SectionHeading, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Writing",
  description: "Articles by Logesh Kumar, published on Medium.",
};

const BlogPage = () => (
  <>
    <main className="container pb-24 pt-32 md:pt-40">
      <SectionHeading as="h1" index="//" label="Writing" title="Blog" intro="Welcome to my blog page." />
      <BlogList />
    </main>
    <SiteFooter />
  </>
);

export default BlogPage;
