// src/config.ts
export const SITE = {
  website: 'https://jasperjapp.com',
  author: 'Jasper Japp',
  desc: "Jasper Japp's Engineering Portfolio",
  title: "Jasper Japp's Portfolio",
  ogImage: '/og-image.png',      // or remove if your theme sets it elsewhere
  lightAndDarkMode: true,
  postPerPage: 8,
  timezone: 'Australia/Sydney',
  profile: '/avatar.jpg'         // <-- add this line
} as const;

