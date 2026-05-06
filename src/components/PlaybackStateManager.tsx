"use client";

import { useEffect, useState } from "react";
import {
  PLAYER_STATE_EVENT,
  type PlayerState,
  readPlayerState,
  writePlayerState,
} from "@/lib/playerState";

export default function PlaybackStateManager() {
  const [state, setState] = useState<PlayerState | null>(null);

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
    if (!state?.isPlaying) return;

    const timer = window.setInterval(() => {
      const latest = readPlayerState();
      if (!latest?.isPlaying) return;
      writePlayerState({ ...latest, position: latest.position + 1 });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state?.isPlaying]);

  return null;
}
