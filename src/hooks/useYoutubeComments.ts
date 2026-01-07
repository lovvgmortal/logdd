import { useState } from "react";
import { useToast } from "./use-toast";
import { useUserSettings } from "./useUserSettings";
import { fetchYoutubeComments, YouTubeComment, getVideoId } from "@/lib/youtube";

export type { YouTubeComment };
export { getVideoId };

export function useYoutubeComments() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const fetchComments = async (url: string, maxComments: number = 200): Promise<YouTubeComment[]> => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return [];
    }

    const apiKey = settings?.youtube_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "YouTube API Key not configured. Please enter your key in Settings.",
        variant: "destructive",
      });
      return [];
    }

    setLoading(true);
    try {
      const comments = await fetchYoutubeComments(url, apiKey, maxComments);

      toast({
        title: "Success",
        description: `Fetched ${comments.length} comments`,
      });

      return comments;
    } catch (error) {
      console.error("Error fetching YouTube comments:", error);
      const message = error instanceof Error ? error.message : "Could not fetch comments";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchComments,
    loading,
  };
}