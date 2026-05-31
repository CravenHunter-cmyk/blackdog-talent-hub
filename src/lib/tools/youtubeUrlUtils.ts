export function extractYouTubeVideoId(url: string) {
  const value = url.trim();
  if (!value) return "";

  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const watchId = parsedUrl.searchParams.get("v");
      if (watchId) return watchId;

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if ((pathParts[0] === "shorts" || pathParts[0] === "embed" || pathParts[0] === "live") && pathParts[1]) {
        return pathParts[1];
      }
    }

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{6,})/);
    return match?.[1] || "";
  }

  return "";
}

export function normalizeYouTubeUrl(url: string) {
  const trimmedUrl = url.trim();
  const videoId = extractYouTubeVideoId(trimmedUrl);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  return trimmedUrl.replace(/\s+/g, "");
}

