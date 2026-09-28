/** @type {import('next').NextConfig} */
const nextConfig = {
  // The old standalone pages are now sections of the single-page story.
  async redirects() {
    return [
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/work", destination: "/#experience", permanent: true },
      { source: "/projects", destination: "/#work", permanent: true },
      { source: "/skills", destination: "/#stack", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
    ];
  },
};

module.exports = nextConfig;
