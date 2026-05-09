import LyricHeader from "@/components/LyricHeader";
import LyricPlayer from "@/components/LyricPlayer";
import { getPlaylistByTrackId, getTrackById, tracks } from "@/data/library";

export function generateStaticParams() {
  return tracks.map((track) => ({ trackId: track.id }));
}

export default function LyricPage({
  params,
  searchParams,
}: {
  params: { trackId: string };
  searchParams: { resume?: string };
}) {
  const currentTrack = getTrackById(params.trackId);
  const playlist = getPlaylistByTrackId(params.trackId);
  const queue = playlist ? playlist.tracks : tracks;

  if (!currentTrack) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[420px] bg-zinc-100 px-3.5 pb-6 pt-4 dark:bg-zinc-900">
        <p>Track tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-h-[100dvh] min-h-screen w-full max-w-[420px] bg-zinc-100 px-3.5 pb-40 pt-4 dark:bg-zinc-900 overflow-hidden">
      <LyricHeader
        queue={queue}
        initialTrackId={currentTrack.id}
        backHref={playlist ? `/playlist/${playlist.id}` : "/"}
      />
      <LyricPlayer
        queue={queue}
        initialTrackId={currentTrack.id}
        playlistId={playlist?.id}
        preferSharedState={searchParams.resume === "1"}
      />
    </main>
  );
}
