import { Capacitor, registerPlugin } from "@capacitor/core";
import { getTrackById } from "@/data/library";
import type { PlayerState } from "@/lib/playerState";

export const NATIVE_POPUP_ENABLED_KEY = "lyrics-native-popup-enabled";
export const NATIVE_POPUP_TOGGLE_EVENT = "lyrics-native-popup-toggle-request";

type PopupPayload = {
  title: string;
  artist: string;
  lyric: string;
  status: "Playing" | "Paused";
};

type LyricsPopupPlugin = {
  open(): Promise<void>;
  close(): Promise<void>;
  update(payload: PopupPayload): Promise<void>;
};

const LyricsPopup = registerPlugin<LyricsPopupPlugin>("LyricsPopup", {
  web: () => ({
    open: async () => {},
    close: async () => {},
    update: async () => {},
  }),
});

export const canUseNativePopup = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export const toPopupPayload = (state: PlayerState): PopupPayload | null => {
  const trackId = state.queueIds[state.trackIndex];
  const track = trackId ? getTrackById(trackId) : undefined;
  if (!track) return null;

  const activeIndex = track.lyrics.findIndex((line, idx) => {
    const nextTime = track.lyrics[idx + 1]?.time ?? Number.MAX_SAFE_INTEGER;
    return state.position >= line.time && state.position < nextTime;
  });

  return {
    title: track.title,
    artist: track.artist,
    lyric: activeIndex >= 0 ? track.lyrics[activeIndex].text : "...",
    status: state.isPlaying ? "Playing" : "Paused",
  };
};

export default LyricsPopup;
