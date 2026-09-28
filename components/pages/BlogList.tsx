"use client";

import { useEffect, useState } from "react";

interface BlogItem {
  title: string;
  link: string;
  thumbnail?: string;
  description: string;
  pubDate: string;
}

interface FeedItem extends BlogItem {
  content?: string;
}

const FEED = "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@logii";
const MEDIUM = "https://medium.com/@logii";

const BlogList = () => {
  const [blogs, setBlogs] = useState<BlogItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(FEED)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { items?: FeedItem[] }) => {
        if (!alive) return;
        setBlogs(
          (data.items ?? []).map((item) => ({
            ...item,
            // Medium often omits the thumbnail field; fall back to the first image in the post.
            thumbnail: item.thumbnail || item.content?.match(/<img[^>]+src="([^">]+)"/)?.[1],
          }))
        );
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed || (blogs && blogs.length === 0)) {
    return (
      <p className="rounded-2xl border border-line/10 bg-panel/40 p-6 text-muted">
        The feed couldn&apos;t be loaded right now. Read everything on{" "}
        <a href={MEDIUM} className="link-underline text-fg" target="_blank" rel="noopener noreferrer">
          Medium
        </a>
        .
      </p>
    );
  }

  if (!blogs) {
    return (
      <div aria-busy="true" aria-label="Loading posts" className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-panel/40" />
        ))}
      </div>
    );
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {blogs.map((blog) => (
        <li key={blog.link}>
          <a
            href={blog.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-panel/50 transition-colors duration-500 hover:border-line/20 hover:bg-panel"
          >
            {blog.thumbnail && (
              <div className="aspect-[16/8] overflow-hidden border-b border-line/10 bg-ink">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Medium CDN images */}
                <img
                  src={blog.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-[transform,opacity] duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <p className="font-mono text-[0.7rem] text-muted">
                {new Date(blog.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <h2 className="mt-2 font-display text-xl tracking-tight">{blog.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {blog.description.replace(/<[^>]+>/g, "").slice(0, 220)}
              </p>
              <span className="mt-auto pt-5 text-sm text-fg/80 group-hover:text-signal">Read on Medium ↗</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default BlogList;
