"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { Track } from "@/data/library";
import {
  PLAYER_STATE_EVENT,
  type PlayerState,
  readPlayerState,
  writePlayerState,
} from "@/lib/playerState";

type Props = {
  queue: Track[];
  initialTrackId?: string;
  playlistId?: string;
};

export default function LyricPlayer({
  queue,
  initialTrackId,
  playlistId,
}: Props) {
  const initialIndex = useMemo(() => {
    if (!initialTrackId) return 0;
    const idx = queue.findIndex((q) => q.id === initialTrackId);
    return idx >= 0 ? idx : 0;
  }, [initialTrackId, queue]);

  const [trackIndex, setTrackIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const lyricContainerRef = useRef<HTMLDivElement | null>(null);
  const lyricLineRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const idleScrollTimeoutRef = useRef<number | null>(null);
  const activeLyricIndexRef = useRef(-1);

  const currentTrack = queue[trackIndex];
  const activeLyricIndex = currentTrack.lyrics.findIndex((line, idx) => {
    const nextTime =
      currentTrack.lyrics[idx + 1]?.time ?? Number.MAX_SAFE_INTEGER;
    return position >= line.time && position < nextTime;
  });

  const queueIds = useMemo(() => queue.map((item) => item.id), [queue]);

  const applySharedState = useCallback(
    (shared: PlayerState) => {
      const sharedTrackId = shared.queueIds[shared.trackIndex];
      const nextIndex = queue.findIndex((item) => item.id === sharedTrackId);
      if (nextIndex === -1) return false;

      setTrackIndex(nextIndex);
      setPosition(shared.position);
      setIsPlaying(shared.isPlaying);
      return true;
    },
    [queue],
  );

  const writeSharedState = useCallback(
    (patch: Partial<PlayerState>) => {
      const prev = readPlayerState();
      writePlayerState({
        queueIds,
        trackIndex,
        position,
        isPlaying,
        playlistId,
        ...prev,
        ...patch,
      });
    },
    [isPlaying, playlistId, position, queueIds, trackIndex],
  );

  const togglePlay = () => {
    writeSharedState({ isPlaying: !isPlaying });
  };

  const seek = (delta: number) => {
    const nextPosition = Math.max(
      0,
      Math.min(currentTrack.duration, position + delta),
    );
    writeSharedState({ position: nextPosition });
  };

  const switchTrack = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= queue.length) return;
    writeSharedState({ trackIndex: nextIndex, position: 0, isPlaying: false });
  };

  useEffect(() => {
    const shared = readPlayerState();
    const didSync = shared ? applySharedState(shared) : false;

    if (!didSync) {
      writePlayerState({
        queueIds,
        trackIndex: initialIndex,
        position: 0,
        isPlaying: false,
        playlistId,
      });
    }

    setIsHydrated(true);
  }, [applySharedState, initialIndex, playlistId, queueIds]);

  useEffect(() => {
    const syncFromSharedState = () => {
      const shared = readPlayerState();
      if (!shared) return;
      applySharedState(shared);
    };

    window.addEventListener(
      PLAYER_STATE_EVENT,
      syncFromSharedState as EventListener,
    );
    window.addEventListener("storage", syncFromSharedState);

    return () => {
      window.removeEventListener(
        PLAYER_STATE_EVENT,
        syncFromSharedState as EventListener,
      );
      window.removeEventListener("storage", syncFromSharedState);
    };
  }, [applySharedState]);

  useEffect(() => {
    if (!isHydrated) return;
    writePlayerState({
      queueIds,
      trackIndex,
      position,
      isPlaying,
      playlistId,
    });
  }, [isHydrated, queueIds, trackIndex, position, isPlaying, playlistId]);

  useEffect(() => {
    activeLyricIndexRef.current = activeLyricIndex;
  }, [activeLyricIndex]);

  useEffect(() => {
    if (activeLyricIndex < 0 || isUserScrolling) return;

    const activeEl = lyricLineRefs.current[activeLyricIndex];
    activeEl?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLyricIndex, isUserScrolling]);

  useEffect(() => {
    return () => {
      if (idleScrollTimeoutRef.current) {
        window.clearTimeout(idleScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLyricScroll = () => {
    setIsUserScrolling(true);

    if (idleScrollTimeoutRef.current) {
      window.clearTimeout(idleScrollTimeoutRef.current);
    }

    idleScrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
      const activeEl = lyricLineRefs.current[activeLyricIndexRef.current];
      activeEl?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 1400);
  };

  if (!currentTrack) {
    return <p>Track tidak ditemukan.</p>;
  }

  const progress =
    currentTrack.duration > 0 ? (position / currentTrack.duration) * 100 : 0;

  return (
    <section className="grid justify-items-center gap-3">
      <div
        ref={lyricContainerRef}
        onScroll={handleLyricScroll}
        className="mt-1 w-full max-h-[71dvh] overflow-auto pb-2"
      >
        {currentTrack.lyrics.map((line, idx) => (
          <button
            key={`${line.time}-${idx}`}
            ref={(el) => {
              lyricLineRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => writeSharedState({ position: line.time })}
            className={`w-full rounded-lg px-1 py-2 text-left leading-6 duration-200 ${idx === activeLyricIndex ? "font-bold text-indigo-950 dark:text-violet-300 text-xl" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {line.text}
          </button>
        ))}
      </div>

      <div className="fixed bottom-3 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 px-3.5">
        <div className="rounded-2xl bg-zinc-100/95 p-4 text-zinc-700 shadow-lg backdrop-blur dark:bg-zinc-800 dark:text-zinc-300 dark:shadow-none dark:backdrop-blur-none">
          <div>
            <input
              type="range"
              min={0}
              max={currentTrack.duration}
              value={position}
              onChange={(e) =>
                writeSharedState({ position: Number(e.target.value) })
              }
              style={{
                background: `linear-gradient(to right, rgb(139 92 246) 0%, rgb(139 92 246) ${progress}%, rgb(63 63 70) ${progress}%, rgb(63 63 70) 100%)`,
              }}
              className="h-1 w-full appearance-none rounded-full"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
              <small>
                {Math.floor(position / 60)}:
                {String(position % 60).padStart(2, "0")}
              </small>
              <small>
                {Math.floor(currentTrack.duration / 60)}:
                {String(currentTrack.duration % 60).padStart(2, "0")}
              </small>
            </div>
          </div>

          <div className="mt-2 flex justify-center gap-2">
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-800 dark:bg-zinc-800 dark:text-violet-300"
              onClick={() => seek(-5)}
              aria-label="Mundur 5 detik"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-800 dark:text-violet-300"
              onClick={() => switchTrack(trackIndex - 1)}
              disabled={trackIndex === 0}
              aria-label="Track sebelumnya"
            >
              <SkipBack size={18} />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-600 text-white"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-800 dark:text-violet-300"
              onClick={() => switchTrack(trackIndex + 1)}
              disabled={trackIndex === queue.length - 1}
              aria-label="Track selanjutnya"
            >
              <SkipForward size={18} />
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-800 dark:bg-zinc-800 dark:text-violet-300"
              onClick={() => seek(5)}
              aria-label="Maju 5 detik"
            >
              <RotateCw size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
