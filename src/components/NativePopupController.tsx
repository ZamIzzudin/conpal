"use client";

import { useEffect, useState } from "react";
import {
  PLAYER_STATE_EVENT,
  type PlayerState,
  readPlayerState,
} from "@/lib/playerState";
import LyricsPopup, {
  NATIVE_POPUP_ENABLED_KEY,
  NATIVE_POPUP_TOGGLE_EVENT,
  canUseNativePopup,
  toPopupPayload,
} from "@/lib/nativePopup";

export default function NativePopupController() {
  const [state, setState] = useState<PlayerState | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setState(readPlayerState());
    sync();
    setEnabled(window.localStorage.getItem(NATIVE_POPUP_ENABLED_KEY) === "1");

    window.addEventListener("storage", sync);
    window.addEventListener(PLAYER_STATE_EVENT, sync as EventListener);

    const onToggle = () => {
      const nextEnabled =
        window.localStorage.getItem(NATIVE_POPUP_ENABLED_KEY) === "1";
      setEnabled(nextEnabled);
    };

    window.addEventListener(NATIVE_POPUP_TOGGLE_EVENT, onToggle as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PLAYER_STATE_EVENT, sync as EventListener);
      window.removeEventListener(
        NATIVE_POPUP_TOGGLE_EVENT,
        onToggle as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!canUseNativePopup()) return;

    const run = async () => {
      if (!enabled) {
        await LyricsPopup.close();
        return;
      }

      const payload = state ? toPopupPayload(state) : null;
      if (!payload) return;

      await LyricsPopup.open();
      await LyricsPopup.update(payload);
    };

    void run();
  }, [enabled, state]);

  return null;
}
