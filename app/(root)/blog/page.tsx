import type { Metadata } from "next";

import BlogList from "@/components/pages/BlogList";
import { SectionHeading, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "Writing",
  description: "Technical writing by Logesh Kumar, on Medium and Substack.",
};

const BlogPage = () => (
  <>
    <main className="container pb-24 pt-32 md:pt-40">
      <SectionHeading as="h1" index="//" label="Writing" title="Blog" intro="Technical writing from production work. Also on Substack: substack.com/@unknowncoder." />
      <BlogList />
    </main>
    <SiteFooter />
  </>
);

export default BlogPage;
