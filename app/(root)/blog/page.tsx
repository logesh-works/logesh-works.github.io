"use client";
import React, { useEffect, useState } from "react";

type BlogItem = {
    title: string;
    link: string;
    thumbnail: string;
    description: string;
    pubDate: string;
};

const Blog = () => {
    const [blogs, setBlogs] = useState<BlogItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(
            "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@logii"
        )
            .then((res) => res.json())
            .then((data) => {
                const blogsWithThumbnails = (data.items || []).map((item: any) => {
                    let thumbnail = item.thumbnail;
                    if (!thumbnail && item.content) {
                        const match = item.content.match(/<img[^>]+src="([^">]+)"/);
                        if (match && match[1]) {
                            thumbnail = match[1];
                        }
                    }
                    return {
                        ...item,
                        thumbnail,
                    };
                });
                setBlogs(blogsWithThumbnails);
                setLoading(false);
            });
    }, []);
    

    return (
        
        <div className="flex flex-col items-center py-14 gap-10 px-10 pb-24">
            <h1>Blogs</h1>
            <p className="text-lg mb-4">Welcome to my blog page.</p>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 justify-items-center lg:pl-10">
                    {blogs.map((blog) => (
                        <a
                            key={blog.link}
                            href={blog.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full max-w-md"
                        >
                            <div className="blog-post flex flex-col h-96 p-6 border rounded shadow-lg bg-gray-900">
                                <div className="flex-shrink-0 w-full h-40 overflow-hidden rounded mb-4">
                                    <img
                                        src={blog.thumbnail}
                                        alt={blog.title}
                                        className="w-full h-full object-cover object-center"
                                    />
                                </div>
                                <h2 className="text-xl font-semibold mb-2 flex-shrink-0">{blog.title}</h2>
                                <p className="text-gray-600 text-sm mb-2 flex-shrink-0">{new Date(blog.pubDate).toLocaleDateString()}</p>
                                <p className="text-gray-200 flex-grow overflow-hidden">{blog.description.replace(/<[^>]+>/g, '').slice(0, 150)}...</p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Blog;