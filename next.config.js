/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "*.bbystatic.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "images.rawpixel.com" },
      { protocol: "https", hostname: "encrypted-tbn*.gstatic.com" },
      { protocol: "https", hostname: "serpapi.com" },
    ],
  },
};

module.exports = nextConfig;
