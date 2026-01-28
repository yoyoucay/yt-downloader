import { NextRequest, NextResponse } from 'next/server';
import YoutubeSearch from 'youtube-search-api';

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
    const results = await YoutubeSearch.GetListByKeyword(query, false, 1);

    console.log('Raw search results:', JSON.stringify(results, null, 2));

    // Format results - be more lenient with filtering
    const videos = results.items
      .filter((item: any) => {
        // Accept both 'video' type and items with videoId
        return item.type === 'video' || item.id;
      })
      .map((item: any) => {
        // Get the best thumbnail
        const thumbnail = 
          item.thumbnail?.thumbnails?.[item.thumbnail.thumbnails.length - 1]?.url ||
          item.thumbnail?.thumbnails?.[0]?.url ||
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
      .filter((video: any) => video.id) // Only keep videos with valid IDs
      .slice(0, 1); // Ensure only 1 result

    console.log(`Found ${videos.length} videos from search`);

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube', details: error.message },
      { status: 500 }
    );
  }
}