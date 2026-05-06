import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CurrentPlayBar from "@/components/CurrentPlayBar";
import ThemeToggle from "@/components/ThemeToggle";
import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import PlaybackStateManager from "@/components/PlaybackStateManager";
import NativePopupController from "@/components/NativePopupController";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "Sonk",
  description: "Sing Everywhere",
  manifest: "/manifest.json",
};

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
        <NativePopupController />
        <InstallPwaPrompt />
        <ThemeToggle />
        <CurrentPlayBar />
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`}
        </Script>
      </body>
    </html>
  );
}
