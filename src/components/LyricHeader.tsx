"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Track } from "@/data/library";
import { PLAYER_STATE_EVENT, readPlayerState } from "@/lib/playerState";

type Props = {
  queue: Track[];
  initialTrackId: string;
  backHref: string;
};

export default function LyricHeader({ queue, initialTrackId, backHref }: Props) {
  const queueMap = useMemo(() => new Map(queue.map((track) => [track.id, track])), [queue]);
  const [trackId, setTrackId] = useState(initialTrackId);

  useEffect(() => {
    const sync = () => {
      const state = readPlayerState();
      if (!state) return;
      const nextTrackId = state.queueIds[state.trackIndex];
      if (!nextTrackId || !queueMap.has(nextTrackId)) return;
      setTrackId(nextTrackId);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PLAYER_STATE_EVENT, sync as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PLAYER_STATE_EVENT, sync as EventListener);
    };
  }, [queueMap]);

  const track = queueMap.get(trackId) ?? queueMap.get(initialTrackId);
  if (!track) return null;

  return (
    <header className="flex items-center justify-center relative gap-2.5 text-center">
      <Link href={backHref} className="text-2xl leading-none absolute left-0" aria-label="Kembali">
        <ArrowLeft size={24} />
      </Link>
      <div>
        <h1 className="m-0 text-xl font-semibold leading-tight">{track.title}</h1>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{track.artist}</p>
      </div>
    </header>
  );
}
