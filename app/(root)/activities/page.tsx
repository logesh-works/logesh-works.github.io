import type { Metadata } from "next";

import ActivityList from "@/components/pages/ActivityList";
import { SectionHeading, SiteFooter } from "@/components/site";

export const metadata: Metadata = {
  title: "GitHub Activity",
  description: "Recent GitHub pushes by Logesh Kumar, highlighting the latest contributions across projects.",
};

const ActivitiesPage = () => (
  <>
    <main className="container pb-24 pt-32 md:pt-40">
      <SectionHeading
        as="h1"
        index="//"
        label="GitHub activity"
        title="Recent pushes"
        intro="My latest GitHub pushes, pulled live from the GitHub API."
      />
      <ActivityList />
    </main>
    <SiteFooter />
  </>
);

export default ActivitiesPage;
