import { SiteConfig } from "@/types"

export const siteConfig: SiteConfig = {
  name: "Scripter Segments",
  description: "Your application description here",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "https://your-domain.com/og.jpg",
  links: {
    twitter: "https://twitter.com/yourusername",
    github: "https://github.com/yourusername",
  },
} 