"use client";

import { useEffect, useState } from "react";

import { profile } from "@/constants";
import getGitHubActivity, { type GitHubActivity } from "@/lib/github";

const ActivityList = () => {
  const [activities, setActivities] = useState<GitHubActivity[] | null>(null);

  useEffect(() => {
    let alive = true;
    getGitHubActivity(profile.githubUser).then((data) => alive && setActivities(data));
    return () => {
      alive = false;
    };
  }, []);

  if (activities === null) {
    return (
      <ul aria-busy="true" aria-label="Loading activity" className="divide-y divide-line/10 border-y border-line/10">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-[4.5rem] animate-pulse bg-panel/30" />
        ))}
      </ul>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="rounded-2xl border border-line/10 bg-panel/40 p-6 text-muted">
        No recent public pushes to show right now. Everything is on{" "}
        <a href={profile.github} className="link-underline text-fg" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line/10 border-y border-line/10">
      {activities.map((a) => (
        <li key={a.repo}>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-panel/40 md:px-4"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
              <span className="truncate font-mono text-sm">{a.repo}</span>
            </span>
            <span className="shrink-0 font-mono text-xs text-muted group-hover:text-fg">
              {a.daysAgo === 0 ? "today" : `${a.daysAgo} day${a.daysAgo === 1 ? "" : "s"} ago`} ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default ActivityList;
