// src/config.ts
export const SITE = {
  // Canonical URLs
  website: "https://jasperjapp.com",

  // Branding
  author: "Jasper Japp",
  title: "Jasper Japp's Portfolio",
  desc: "Jasper Japp's Engineering Portfolio",
  profile: "/avatar.jpg",        // ensure this file exists in /public

  // UI behaviour
  lightAndDarkMode: true,
  showBackButton: true,           // used by BackButton / layouts
  showArchives: true,             // controls /archives visibility
  postPerIndex: 6,                // how many posts/cards on the home page
  postPerPage: 8,                 // blog pagination

  // Editing link under posts (optional)
  editPost: {
    enabled: true,
    // Update with your GitHub username & repo:
    url: "https://github.com/j-jappa/Portfolio/edit/main/",
    text: "Edit this page on GitHub",
  },

  linkedinUrl: "https://www.linkedin.com/in/jasper-japp",

  // Open Graph image behaviour
  ogImage: "og.png",  
  dynamicOgImage: false,          // set true if you’ve configured the OG generator

  // Locale
  lang: "en",
  dir: "ltr",
  timezone: "Australia/Sydney",

  // Scheduling tolerance (ms) — allow posts dated slightly in the future to render
  scheduledPostMargin: 0,
} as const;
export const NAV_LINKS = [
  { title: 'Projects', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'Experience', path: '/experience' },
];
