import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CurrentPlayBar from "@/components/CurrentPlayBar";
import ThemeToggle from "@/components/ThemeToggle";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import PlaybackStateManager from "@/components/PlaybackStateManager";
import { playlists, tracks } from "@/data/library";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "Conpal",
  description: "Sing Everywhere",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
  },
};
const localThumbnailUrls = Array.from(
  new Set(
    [...playlists.map((playlist) => playlist.thumbnail), ...tracks.map((track) => track.thumbnail)]
      .filter((thumb): thumb is string => Boolean(thumb && thumb.startsWith("/"))),
  ),
);

const offlineUrls = [
  "/",
  "/manifest.json",
  "/icon.jpg",
  ...playlists.map((playlist) => `/playlist/${playlist.id}`),
  ...tracks.map((track) => `/lyric/${track.id}`),
  ...localThumbnailUrls,
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${montserrat.variable} ${raleway.variable}`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => { const key = 'lyrics-theme'; const saved = localStorage.getItem(key); const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark', isDark); })();`}
        </Script>
        {children}
        <PlaybackStateManager />
        <InstallPwaPrompt />
        <ThemeToggle />
        <CurrentPlayBar />
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', async () => { const offlineUrls = ${JSON.stringify(offlineUrls)}; const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' }); await registration.update(); if (registration.waiting) { registration.waiting.postMessage({ type: 'SKIP_WAITING' }); } const postPrecache = () => { if (registration.active) { registration.active.postMessage({ type: 'PRECACHE_URLS', urls: offlineUrls }); } }; postPrecache(); navigator.serviceWorker.addEventListener('controllerchange', postPrecache); navigator.serviceWorker.ready.then(postPrecache); setTimeout(postPrecache, 800); }); }`}
        </Script>
      </body>
    </html>
  );
}
