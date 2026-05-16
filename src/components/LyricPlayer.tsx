"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
  X,
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
  preferSharedState?: boolean;
};

export default function LyricPlayer({
  queue,
  initialTrackId,
  playlistId,
  preferSharedState = false,
}: Props) {
  const router = useRouter();

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscapeLayout, setIsLandscapeLayout] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

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

  const switchTrack = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= queue.length) return;
    writeSharedState({ trackIndex: nextIndex, position: 0, isPlaying: false });
  };

  useEffect(() => {
    const shared = readPlayerState();
    const didSync =
      preferSharedState && shared ? applySharedState(shared) : false;

    if (!didSync) {
      writePlayerState({
        queueIds,
        trackIndex: initialIndex,
        position: 0,
        isPlaying: false,
        playlistId,
      });
      setTrackIndex(initialIndex);
      setPosition(0);
      setIsPlaying(false);
    }

    setIsHydrated(true);
  }, [applySharedState, initialIndex, playlistId, preferSharedState, queueIds]);

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

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const hasEnded = position >= currentTrack.duration;
    if (hasEnded && (position !== currentTrack.duration || isPlaying)) {
      writeSharedState({ position: currentTrack.duration, isPlaying: false });
    }
    setShowEndOverlay(hasEnded);
  }, [currentTrack.duration, isPlaying, position, writeSharedState]);

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

  const toggleLayoutRotation = () => {
    setIsLandscapeLayout((prev) => !prev);
  };

  if (!currentTrack) {
    return <p>Track tidak ditemukan.</p>;
  }

  const progress =
    currentTrack.duration > 0 ? (position / currentTrack.duration) * 100 : 0;
  const isLastTrack = trackIndex === queue.length - 1;

  const handleEndOverlayAction = () => {
    if (isLastTrack) {
      router.push("/");
      return;
    }

    switchTrack(trackIndex + 1);
    setShowEndOverlay(false);
  };

  return (
    <section
      className={`grid justify-items-center gap-3 ${isFullscreen ? "fixed inset-0 z-50 bg-zinc-100 p-3.5 dark:bg-zinc-900" : ""}`}
    >
      <div
        className={
          isFullscreen
            ? `relative grid ${isLandscapeLayout ? "grid-cols-[1fr_auto] gap-3 h-[100dvw] w-[80dvh] rotate-[90deg] -translate-y-[40dvh]" : "grid-rows-[auto_1fr] h-full w-full"}`
            : "w-full"
        }
      >
        {isFullscreen ? (
          <div
            className={`flex items-center justify-between gap-2 ${isLandscapeLayout ? "col-span-2" : "pb-1"}`}
          >
            <div className="min-w-0">
              <p
                className={`truncate font-semibold leading-tight ${isLandscapeLayout ? "text-base" : "text-sm"}`}
              >
                {currentTrack.title}
              </p>
              <p
                className={`truncate text-zinc-500 dark:text-zinc-400 ${isLandscapeLayout ? "text-xs" : "text-[11px]"}`}
              >
                {currentTrack.artist}
              </p>
            </div>
          </div>
        ) : null}

        <div
          ref={lyricContainerRef}
          onScroll={handleLyricScroll}
          className={`mt-1 w-full overflow-auto pb-2 ${isFullscreen ? (isLandscapeLayout ? "h-[calc(100dvh-80px)]" : "h-[calc(100dvh-88px)]") : "max-h-[71dvh]"}`}
        >
          {currentTrack.lyrics.map((line, idx) => (
            <button
              key={`${line.time}-${idx}`}
              ref={(el) => {
                lyricLineRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => writeSharedState({ position: line.time })}
              className={`w-full rounded-lg px-1 py-2 text-left duration-200 ${isFullscreen && isLandscapeLayout ? "leading-8 text-xl" : "leading-6"} ${idx === activeLyricIndex ? "font-bold text-indigo-950 dark:text-violet-300 text-xl" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              {line.text}
            </button>
          ))}
        </div>
        {isFullscreen ? (
          <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex flex-col gap-2 p-2">
            <button
              type="button"
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-800 dark:bg-zinc-800 dark:text-violet-300"
              onClick={toggleLayoutRotation}
              aria-label="Rotate layout"
            >
              <RotateCw size={14} />
            </button>
            <button
              type="button"
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white"
              onClick={() => setIsFullscreen(false)}
              aria-label="Exit fullscreen"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        ) : null}
      </div>

      {!isFullscreen ? (
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

            <div className="mt-2 flex justify-center gap-2 relative">
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
                className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-800 dark:bg-zinc-800 dark:text-violet-300 absolute right-0"
                onClick={() => setIsFullscreen(true)}
                aria-label="Masuk fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEndOverlay ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4">
          <div className="relative w-full max-w-[420px] rounded-2xl bg-zinc-100 p-5 text-center text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 min-h-[50dvh] flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setShowEndOverlay(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Close overlay"
            >
              <X size={14} />
            </button>
            <p className="text-lg font-semibold">
              {isLastTrack
                ? "ONE OK FCKN ROCKKK!!! LETSGOOO!!!"
                : "MOVE TO THE NEXT SONG??"}
            </p>
            <button
              type="button"
              onClick={handleEndOverlayAction}
              className="mt-4 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white"
            >
              {isLastTrack ? "Lets Go Home" : "Yes, Lets goo"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
