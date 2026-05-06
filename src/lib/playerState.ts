import { getTrackById } from '@/data/library';

export type PlayerState = {
  queueIds: string[];
  trackIndex: number;
  position: number;
  isPlaying: boolean;
  playlistId?: string;
};

export const PLAYER_STATE_KEY = 'lyrics-current-play';
export const PLAYER_STATE_EVENT = 'lyrics-current-play-changed';

export const clampPlayerState = (state: PlayerState): PlayerState => {
  const safeQueue = state.queueIds.length ? state.queueIds : [];
  const maxIndex = safeQueue.length - 1;
  const safeIndex = maxIndex >= 0 ? Math.min(Math.max(state.trackIndex, 0), maxIndex) : 0;
  const currentTrackId = safeQueue[safeIndex];
  const duration = currentTrackId ? getTrackById(currentTrackId)?.duration ?? 0 : 0;
  const safePosition = Math.min(Math.max(state.position, 0), duration);

  return {
    ...state,
    queueIds: safeQueue,
    trackIndex: safeIndex,
    position: safePosition
  };
};

export const readPlayerState = (): PlayerState | null => {
  const raw = window.localStorage.getItem(PLAYER_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PlayerState;
    if (!Array.isArray(parsed.queueIds) || typeof parsed.trackIndex !== 'number') return null;
    if (typeof parsed.position !== 'number' || typeof parsed.isPlaying !== 'boolean') return null;
    if (!parsed.queueIds.length) return null;
    return clampPlayerState(parsed);
  } catch {
    return null;
  }
};

export const writePlayerState = (state: PlayerState) => {
  const payload = clampPlayerState(state);
  window.localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(PLAYER_STATE_EVENT));
};
