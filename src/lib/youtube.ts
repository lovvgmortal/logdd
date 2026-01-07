export interface YouTubeComment {
  author: string;
  text: string;
  likeCount: number;
  authorProfileImageUrl?: string;
  publishedAt?: string;
}

export const getVideoId = (url: string): string | null => {
  try {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

export const fetchYoutubeComments = async (url: string, apiKey: string, maxComments: number = 200): Promise<YouTubeComment[]> => {
  if (!apiKey) {
    throw new Error("YouTube API Key not configured. Please enter your key in Settings.");
  }

  const videoId = getVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL.");

  try {
    let allComments: YouTubeComment[] = [];
    let nextPageToken: string | undefined;

    // Fetch pages until we reach maxComments (approximate, since we fetch 100 per page)
    const maxPages = Math.ceil(maxComments / 100);

    for (let i = 0; i < maxPages && allComments.length < maxComments; i++) {
      const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        key: apiKey,
        maxResults: '100',
        order: 'relevance',
        textFormat: 'plainText'
      });

      if (nextPageToken) {
        params.append('pageToken', nextPageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || "Unknown YouTube API error";
        if (errorMsg.includes("disabled")) throw new Error("Comments are disabled for this video.");
        if (errorMsg.includes("API key not valid")) throw new Error("Invalid API Key. Please check your Settings.");
        if (errorMsg.includes("commentsDisabled")) throw new Error("Comments are disabled for this video.");
        throw new Error(errorMsg);
      }

      if (data.items) {
        const comments: YouTubeComment[] = data.items.map((item: any) => {
          const snippet = item.snippet.topLevelComment.snippet;
          return {
            author: snippet.authorDisplayName,
            text: snippet.textDisplay,
            likeCount: snippet.likeCount,
            authorProfileImageUrl: snippet.authorProfileImageUrl,
            publishedAt: snippet.publishedAt,
          };
        });
        allComments = allComments.concat(comments);
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    // Sort by like count and take requested amount
    return allComments
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, maxComments);
  } catch (error: any) {
    console.error("YouTube Fetch Error:", error);
    throw new Error(error.message || "Could not fetch comments.");
  }
};