import Link from "next/link";
import { ArrowLeft, Music2 } from "lucide-react";
import { getPlaylistById, playlists } from "@/data/library";

export function generateStaticParams() {
  return playlists.map((playlist) => ({ id: playlist.id }));
}

export default function PlaylistTrackListPage({
  params,
}: {
  params: { id: string };
}) {
  const playlist = getPlaylistById(params.id);

  if (!playlist) {
    return (
      <main
        className="mx-auto min-h-screen w-full max-w-[420px] bg-zinc-100 px-3.5 pt-4 dark:bg-zinc-900"
        style={{
          paddingBottom: "calc(24px + var(--current-playbar-space, 0px))",
        }}
      >
        <p>Playlist tidak ditemukan.</p>
        <Link href="/">Kembali</Link>
      </main>
    );
  }

  const tracks = playlist.tracks;

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-[420px] bg-zinc-100 px-3.5 pt-4 dark:bg-zinc-900"
      style={{
        paddingBottom: "calc(45px + var(--current-playbar-space, 0px))",
      }}
    >
      <header className="mb-3.5 py-3 flex items-center gap-2.5">
        <Link href="/" className="text-2xl leading-none" aria-label="Kembali">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="m-0 text-lg font-semibold leading-tight">
          {playlist.name}
        </h1>
      </header>

      <div className="grid gap-2.5">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/lyric/${track.id}?playlistId=${playlist.id}`}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-2.5 rounded-[14px] bg-white p-2.5 shadow-lg shadow-zinc-300/70 dark:bg-zinc-800 dark:shadow-none"
          >
            <div
              className="grid h-11 w-11 place-items-center rounded-[10px] bg-gradient-to-br from-violet-900 to-indigo-950 text-white"
              style={{
                backgroundImage: `url(${track?.thumbnail})`,
                backgroundSize: "cover",
              }}
            >
              {!track?.thumbnail && <Music2 size={18} />}
            </div>
            <div>
              <p className="block font-semibold">{track.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {track.artist}
              </p>
            </div>
            <small className="dark:text-zinc-300">
              {Math.floor(track.duration / 60)}:
              {String(track.duration % 60).padStart(2, "0")}
            </small>
          </Link>
        ))}
      </div>
    </main>
  );
}
