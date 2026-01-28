import { NextRequest, NextResponse } from 'next/server';
import YoutubeSearch from 'youtube-search-api';
import { rateLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';
import { VideoInfo, YtDlpService } from '@/lib/services/yt-dlp.service';
import { SearchQuery, SearchRequestSchema, VideoId } from '@/lib/validation';

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  url: string;
  availableFormats?: {
    video: string[];
    audio: string[];
  };
}

export class SearchService {
  private ytDlpService: YtDlpService;

  constructor() {
    this.ytDlpService = new YtDlpService();
  }

  async searchVideos(query: SearchQuery): Promise<VideoResult[]> {
    try {
      logger.info({ query }, 'Searching videos');
      
      const videoId = this.extractVideoId(query);
      
      if (videoId) {
        logger.info({ videoId }, 'Detected YouTube URL, fetching video directly');
        const video = await this.getVideoDetails(videoId);
        return [video];
      }
      
      const result = await YoutubeSearch.GetListByKeyword(query, false, 1);
      
      const videos = await Promise.all(
        result.items
          .filter((item: any) => item.type === 'video')
          .slice(0, 1)
          .map(async (item: any) => {
            try {
              const info = await this.ytDlpService.getVideoInfo(item.id);
              return {
                id: item.id,
                title: info.title,
                thumbnail: item.thumbnail?.thumbnails?.[0]?.url || info.thumbnail,
                duration: item.length?.simpleText || this.formatDuration(info.duration),
                channel: info.channel,
                url: `https://www.youtube.com/watch?v=${item.id}`,
                availableFormats: info.availableFormats
              };
            } catch (error) {
              logger.warn({ error, videoId: item.id }, 'Failed to get detailed info for video');
              return {
                id: item.id,
                title: item.title,
                thumbnail: item.thumbnail?.thumbnails?.[0]?.url || '',
                duration: item.length?.simpleText || '0:00',
                channel: item.channelTitle,
                url: `https://www.youtube.com/watch?v=${item.id}`,
                availableFormats: {
                  video: ['360p', '480p', '720p', '1080p'],
                  audio: ['128kbps', '192kbps', '256kbps', '320kbps']
                }
              };
            }
          })
      );
      
      return videos;
    } catch (error) {
      logger.error({ error, query }, 'Search failed');
      throw new Error('Failed to search videos');
    }
  }

  async getVideoDetails(videoId: VideoId): Promise<VideoResult> {
    try {
      logger.info({ videoId }, 'Getting video details');
      
      const info: VideoInfo = await this.ytDlpService.getVideoInfo(videoId);
      
      return {
        id: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: this.formatDuration(info.duration),
        channel: info.channel,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        availableFormats: info.availableFormats
      };
    } catch (error) {
      logger.error({ error, videoId }, 'Failed to get video details');
      throw new Error('Failed to get video details');
    }
  }

  private extractVideoId(query: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private formatDuration(duration: string | number): string {
    if (typeof duration === 'string') return duration;
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

const searchService = new SearchService();

export async function GET(request: NextRequest) {
  try {
    if (!rateLimiter.checkRateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    const validation = SearchRequestSchema.safeParse({ query });

    if (!validation.success) {
      logger.warn({ errors: validation.error.errors }, 'Invalid search request');
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { query: validatedQuery } = validation.data;
    const videos = await searchService.searchVideos(validatedQuery);

    console.log({ query: validatedQuery, contentVideos: videos, resultCount: videos.length})

    logger.info({ query: validatedQuery, resultCount: videos.length }, 'Search completed');

    return NextResponse.json({ videos });
  } catch (error) {
    logger.error({ error }, 'Search endpoint error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}