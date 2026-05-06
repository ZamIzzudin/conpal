"use client";

import Link from "next/link";
import { Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { playlists } from "@/data/library";

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bannerTranslate = Math.min(scrollY * 0.8, 1000);
  const bannerScale = Math.max(1 - scrollY * 0.00035, 1);

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-[420px] bg-zinc-100 px-3.5 pt-4 dark:bg-zinc-900"
      style={{
        paddingBottom: "calc(45px + var(--current-playbar-space, 0px))",
      }}
    >
      <header className="relative mb-3.5 h-[60vh] min-h-[240px] overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${bannerTranslate}px) scale(${bannerScale})`,
            transformOrigin: "center top",
            backgroundImage: "url(/bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/50" />
        <div className="relative flex h-full items-end p-4">
          <h1 className="m-0 text-xl font-semibold leading-tight text-white">
            Playlist
          </h1>
        </div>
      </header>

      <div className="grid min-h-[70vh] grid-cols-2 gap-2.5">
        {playlists.map((playlist) => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className="flex h-fit flex-col items-start gap-2 rounded-[14px] bg-white p-3 shadow-lg shadow-zinc-300/70 dark:bg-zinc-800 dark:shadow-none"
          >
            <div
              className="grid aspect-square w-full place-items-center rounded-[10px] bg-gradient-to-br from-violet-900 to-indigo-950 text-white"
              style={{
                backgroundImage: `url(${playlist?.thumbnail})`,
                backgroundSize: "cover",
              }}
            >
              {!playlist?.thumbnail && <Music2 size={18} />}
            </div>
            <strong className="block text-md font-semibold leading-tight">
              {playlist.name}
            </strong>
            <small className="text-xs text-zinc-500 dark:text-zinc-300">
              {playlist.tracks.length} lagu
            </small>
          </Link>
        ))}
      </div>
    </main>
  );
}
