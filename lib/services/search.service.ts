import YoutubeSearch from 'youtube-search-api';
import { YtDlpService, VideoInfo } from './yt-dlp.service';
import { SearchQuery, VideoId } from '../validation';
import { logger } from '../logger';

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