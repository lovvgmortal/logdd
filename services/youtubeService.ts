
interface YouTubeComment {
  author: string;
  text: string;
  likeCount: number;
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

export const fetchYoutubeComments = async (url: string, apiKey?: string): Promise<string> => {
  if (!apiKey) {
    console.error("YouTube API Key is missing");
    throw new Error("YouTube API Key chưa được cấu hình. Vui lòng nhập key vào Settings.");
  }

  const videoId = getVideoId(url);
  if (!videoId) throw new Error("URL YouTube không hợp lệ.");

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?` + 
      new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        key: apiKey,
        maxResults: '100', 
        order: 'relevance', 
        textFormat: 'plainText'
      });

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || "Lỗi YouTube API không xác định";
      if (errorMsg.includes("disabled")) return "Video này đã tắt tính năng bình luận.";
      if (errorMsg.includes("API key not valid")) return "API Key không hợp lệ. Vui lòng kiểm tra lại trong Settings.";
      throw new Error(errorMsg);
    }

    if (!data.items || data.items.length === 0) {
      return "Không tìm thấy bình luận nào.";
    }

    const formattedComments = data.items.map((item: any) => {
      const snippet = item.snippet.topLevelComment.snippet;
      return `[${snippet.authorDisplayName}] (${snippet.likeCount} likes): ${snippet.textDisplay}`;
    }).join("\n---\n");

    return formattedComments;

  } catch (error: any) {
    console.error("YouTube Fetch Error:", error);
    throw new Error(error.message || "Không thể lấy bình luận.");
  }
};
