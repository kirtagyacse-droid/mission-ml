// YouTube Data API v3 - Playlist Items Fetcher
// Used by seed script and admin playlist import

export interface PlaylistVideo {
  videoId: string;
  title: string;
  position: number;
  thumbnail: string;
}

export async function fetchPlaylistItems(
  playlistId: string,
  apiKey?: string
): Promise<PlaylistVideo[]> {
  const key = apiKey || process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Cannot fetch playlist items."
    );
  }

  const videos: PlaylistVideo[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key,
    });
    if (nextPageToken) {
      params.set("pageToken", nextPageToken);
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(
        `YouTube API error (${res.status}): ${error}`
      );
    }

    const data = await res.json();

    for (const item of data.items ?? []) {
      const snippet = item.snippet;
      // Skip deleted/private videos
      if (
        snippet.title === "Deleted video" ||
        snippet.title === "Private video"
      ) {
        continue;
      }
      videos.push({
        videoId: snippet.resourceId?.videoId ?? "",
        title: snippet.title ?? "Untitled",
        position: snippet.position ?? videos.length,
        thumbnail:
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          "",
      });
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return videos;
}
