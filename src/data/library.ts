export type LyricLine = {
  time: number;
  text: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string;
  lyrics: LyricLine[];
};

export type Playlist = {
  id: string;
  name: string;
  thumbnail?: string;
  tracks: Track[];
};

type PlaylistFile = {
  id: string;
  name: string;
  thumbnail?: string;
  tracks?: Track[];
  trackIds?: Track[];
};

type RequireWithContext = NodeRequire & {
  context: (path: string, deep?: boolean, filter?: RegExp) => {
    keys: () => string[];
    <T>(id: string): T;
  };
};

const loadPlaylistFiles = (): Playlist[] => {
  const req = require as RequireWithContext;
  const context = req.context("./playlists", false, /\.json$/);

  return context
    .keys()
    .map((key) => context<PlaylistFile>(key))
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      thumbnail: playlist.thumbnail,
      tracks: Array.isArray(playlist.tracks)
        ? playlist.tracks
        : Array.isArray(playlist.trackIds)
          ? playlist.trackIds
          : [],
    }))
    .filter((playlist) => playlist.id && playlist.name && playlist.tracks.length > 0);
};

export const playlists: Playlist[] = loadPlaylistFiles();
export const tracks: Track[] = playlists.flatMap((playlist) => playlist.tracks);

export const getPlaylistById = (id: string) =>
  playlists.find((playlist) => playlist.id === id);

export const getTrackById = (id: string) => tracks.find((track) => track.id === id);

export const getPlaylistByTrackId = (trackId: string) =>
  playlists.find((playlist) => playlist.tracks.some((track) => track.id === trackId));

export const getTracksByIds = (ids: string[]) => {
  const idSet = new Set(ids);
  return tracks.filter((track) => idSet.has(track.id));
};
