"use client";

import { AppWindow } from "lucide-react";
import { useEffect, useState } from "react";
import {
  NATIVE_POPUP_ENABLED_KEY,
  NATIVE_POPUP_TOGGLE_EVENT,
  canUseNativePopup,
} from "@/lib/nativePopup";

export default function NativePopupToggleButton() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(canUseNativePopup());
    setEnabled(window.localStorage.getItem(NATIVE_POPUP_ENABLED_KEY) === "1");
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        window.localStorage.setItem(NATIVE_POPUP_ENABLED_KEY, next ? "1" : "0");
        window.dispatchEvent(new Event(NATIVE_POPUP_TOGGLE_EVENT));
      }}
      className={`grid h-9 w-9 place-items-center rounded-full ${enabled ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-700 dark:bg-zinc-700 dark:text-violet-300"}`}
      aria-label="Toggle lyric popup"
      title={enabled ? "Popup aktif" : "Aktifkan popup"}
    >
      <AppWindow size={16} />
    </button>
  );
}
