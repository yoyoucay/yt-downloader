import { NextRequest, NextResponse } from 'next/server';
import YoutubeSearch from 'youtube-search-api';

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeSearchItem {
  type: string;
  id: string;
  title: string;
  thumbnail?: {
    thumbnails?: YouTubeThumbnail[];
  };
  channelTitle?: string;
  channelName?: string;
  length?: {
    simpleText?: string;
  };
  duration?: string;
}

interface SearchResults {
  items: YouTubeSearchItem[];
}

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
  url: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search YouTube - limit to 1 result
    const results = await YoutubeSearch.GetListByKeyword(query, false, 1) as SearchResults;

    console.log('Raw search results:', JSON.stringify(results, null, 2));

    // Format results - be more lenient with filtering
    const videos: VideoResult[] = results.items
      .filter((item: YouTubeSearchItem) => {
        // Accept both 'video' type and items with videoId
        return item.type === 'video' || item.id;
      })
      .map((item: YouTubeSearchItem) => {
        // Get the best thumbnail
        const thumbnails = item.thumbnail?.thumbnails || [];
        const thumbnail = 
          thumbnails[thumbnails.length - 1]?.url ||
          thumbnails[0]?.url ||
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

        return {
          id: item.id,
          title: item.title || 'Untitled',
          thumbnail: thumbnail,
          channel: item.channelTitle || item.channelName || 'Unknown',
          duration: item.length?.simpleText || item.duration || 'N/A',
          url: `https://www.youtube.com/watch?v=${item.id}`,
        };
      })
      .filter((video: VideoResult) => video.id) // Only keep videos with valid IDs
      .slice(0, 1); // Ensure only 1 result

    console.log(`Found ${videos.length} videos from search`);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to search YouTube', details: errorMessage },
      { status: 500 }
    );
  }
}