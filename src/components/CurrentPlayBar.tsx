"use client";

import Link from "next/link";
import { Pause, Play, Music2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getTrackById } from "@/data/library";
import {
  PLAYER_STATE_EVENT,
  type PlayerState,
  readPlayerState,
  writePlayerState,
} from "@/lib/playerState";
import NativePopupToggleButton from "@/components/NativePopupToggleButton";

export default function CurrentPlayBar() {
  const pathname = usePathname();
  const [state, setState] = useState<PlayerState | null>(null);
  const [hiddenTrackId, setHiddenTrackId] = useState<string | null>(null);
  const discRef = useRef<HTMLDivElement | null>(null);
  const spinAnimationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const syncState = () => setState(readPlayerState());

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener(PLAYER_STATE_EVENT, syncState as EventListener);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(
        PLAYER_STATE_EVENT,
        syncState as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const discEl = discRef.current;
    if (!discEl) return;

    if (!spinAnimationRef.current) {
      spinAnimationRef.current = discEl.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
        {
          duration: 4000,
          iterations: Infinity,
          easing: "linear",
        },
      );
      spinAnimationRef.current.pause();
    }

    if (state?.isPlaying) {
      spinAnimationRef.current.play();
    } else {
      spinAnimationRef.current.pause();
    }
  }, [state?.isPlaying]);

  useEffect(() => {
    return () => {
      spinAnimationRef.current?.cancel();
      spinAnimationRef.current = null;
    };
  }, []);

  const currentTrackId = state?.queueIds[state.trackIndex];
  const currentTrack = currentTrackId ? getTrackById(currentTrackId) : undefined;

  const isVisible =
    Boolean(state) &&
    !pathname.startsWith("/lyric/") &&
    Boolean(currentTrack) &&
    hiddenTrackId !== currentTrack?.id;

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--current-playbar-space",
      isVisible ? "104px" : "0px",
    );

    return () => {
      document.documentElement.style.setProperty("--current-playbar-space", "0px");
    };
  }, [isVisible]);

  if (!state || !currentTrack || !isVisible) return null;

  const href = state.playlistId
    ? `/lyric/${currentTrack.id}?playlistId=${state.playlistId}`
    : `/lyric/${currentTrack.id}`;

  const progress =
    currentTrack.duration > 0 ? (state.position / currentTrack.duration) * 100 : 0;

  const updateState = (patch: Partial<PlayerState>) => {
    writePlayerState({ ...state, ...patch });
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 px-3.5 pb-3">
      <div className="rounded-2xl bg-zinc-100/95 p-4 text-zinc-700 shadow-lg backdrop-blur dark:bg-zinc-800 dark:text-zinc-300 dark:shadow-none dark:backdrop-blur-none">
        <div className="flex items-center justify-between">
          <Link href={href} className="flex flex-1 items-center gap-3">
            <div
              ref={discRef}
              className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600"
            >
              <Music2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentTrack.artist}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              onClick={() => setHiddenTrackId(currentTrack.id)}
              aria-label="Hide current player"
            >
              <X size={16} />
            </button>
            <NativePopupToggleButton />
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-white bg-violet-500"
              onClick={() => updateState({ isPlaying: !state.isPlaying })}
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>
        <div className="mt-2">
          <input
            type="range"
            min={0}
            max={currentTrack.duration}
            value={state.position}
            onChange={(e) => updateState({ position: Number(e.target.value) })}
            style={{
              background: `linear-gradient(to right, rgb(139 92 246) 0%, rgb(139 92 246) ${progress}%, rgb(63 63 70) ${progress}%, rgb(63 63 70) 100%)`,
            }}
            className="h-1 w-full appearance-none rounded-full"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
            <small>
              {Math.floor(state.position / 60)}:
              {String(state.position % 60).padStart(2, "0")}
            </small>
            <small>
              {Math.floor(currentTrack.duration / 60)}:
              {String(currentTrack.duration % 60).padStart(2, "0")}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
