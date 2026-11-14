import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Marco Burdeos | wall";
const description = "Write on Marco Burdeos's wall: a 2008-style Facebook Wall with live posts.";

// Absolute URLs for link previews. Vercel sets VERCEL_PROJECT_PRODUCTION_URL at build time.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "profile",
    url: "/",
    siteName: "wall",
    title,
    description,
    images: [{ url: "/profile.jpg", width: 600, height: 600, alt: "Marco Burdeos" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/profile.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b5998",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white antialiased">{children}</body>
    </html>
  );
}
