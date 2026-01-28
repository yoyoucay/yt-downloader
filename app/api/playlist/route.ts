import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('id');

    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

    // Note: @distube/ytdl-core doesn't support playlists directly
    // For a production app, you would use YouTube Data API or ytdl-playlist
    // This is a simplified placeholder
    return NextResponse.json({
      message: 'Playlist support requires YouTube Data API',
      playlistUrl,
      suggestion: 'Use individual video downloads or implement YouTube Data API',
    });
  } catch (error: any) {
    console.error('Playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist', details: error.message },
      { status: 500 }
    );
  }
}
