import { spawn } from 'child_process';
import { YT_DLP_PATH, MAX_FILE_SIZE_MB, FFMPEG_PATH } from '../config';
import { logger } from '../logger';
import { VideoId, Format, QualityVideo, QualityAudio } from '../validation';

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
  viewCount: number;
  availableFormats?: {
    video: string[];
    audio: string[];
  };
}

export interface DownloadResult {
  filePath: string;
  fileSize: number;
  duration: number;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

export class YtDlpService {
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getVideoInfo(videoId: VideoId, retryCount = 0): Promise<VideoInfo> {
    const maxRetries = 3;
    
    try {
      return await this.fetchVideoInfo(videoId);
    } catch (error) {
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        logger.warn({ videoId, retryCount, delayMs }, 'Retrying getVideoInfo');
        await this.delay(delayMs);
        return this.getVideoInfo(videoId, retryCount + 1);
      }
      throw error;
    }
  }

  private async fetchVideoInfo(videoId: VideoId): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-playlist',
        '--user-agent', this.getRandomUserAgent(),
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      const proc = spawn(YT_DLP_PATH, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          logger.error({ videoId, stderr, code }, 'Failed to get video info');
          reject(new Error('Failed to fetch video information'));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          
          const videoFormats = info.formats?.filter((fmt: any) => fmt.vcodec && fmt.vcodec !== 'none' && fmt.acodec && fmt.acodec !== 'none') || [];
          const audioFormats = info.formats?.filter((fmt: any) => fmt.acodec && fmt.acodec !== 'none' && (!fmt.vcodec || fmt.vcodec === 'none')) || [];

          const availableVideoQualities = [...new Set<string>(
            videoFormats
              .map((fmt: any) => fmt.height)
              .filter((height: any): height is number => height !== null && height !== undefined)
              .sort((a: number, b: number) => b - a)
              .map((height: number) => `${height}p`)
          )];

          const availableAudioBitrates = [...new Set<string>(
            audioFormats
              .map((fmt: any) => fmt.abr)
              .filter((bitrate: any): bitrate is number => bitrate !== null && bitrate !== undefined)
              .sort((a: number, b: number) => b - a)
              .map((bitrate: number) => `${Math.round(bitrate)}kbps`)
          )];

          resolve({
            id: info.id,
            title: info.title,
            duration: info.duration || 0,
            thumbnail: info.thumbnail,
            channel: info.uploader || info.channel || 'Unknown',
            viewCount: info.view_count || 0,
            availableFormats: {
              video: availableVideoQualities.length > 0 ? availableVideoQualities : ['360p', '480p', '720p', '1080p'],
              audio: availableAudioBitrates.length > 0 ? availableAudioBitrates : ['128kbps', '192kbps', '256kbps', '320kbps']
            }
          });
        } catch (error) {
          logger.error({ error, stdout }, 'Failed to parse video info');
          reject(new Error('Failed to parse video information'));
        }
      });
    });
  }

  async downloadVideo(
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio,
    outputPath: string,
    retryCount = 0
  ): Promise<DownloadResult> {
    const maxRetries = 3;
    
    try {
      return await this.performDownload(videoId, format, quality, outputPath, retryCount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const is403Error = errorMessage.includes('403') || errorMessage.includes('Forbidden');
      
      if (is403Error && retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 2000 + Math.random() * 2000;
        logger.warn({ videoId, retryCount, delayMs, error: errorMessage }, 'Retrying download due to 403 error');
        await this.delay(delayMs);
        return this.downloadVideo(videoId, format, quality, outputPath, retryCount + 1);
      }
      throw error;
    }
  }

  private async performDownload(
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio,
    outputPath: string,
    retryCount: number
  ): Promise<DownloadResult> {
    return new Promise((resolve, reject) => {
      const args = this.buildDownloadArgs(videoId, format, quality, outputPath, retryCount);
      
      logger.info({ videoId, format, quality, outputPath, retryCount }, 'Starting download');

      const proc = spawn(YT_DLP_PATH, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', async (code) => {
        if (code !== 0) {
          logger.error({ videoId, stderr, code }, 'Download failed');
          reject(new Error(stderr || 'Download failed'));
          return;
        }

        try {
          const fs = await import('fs/promises');
          const stats = await fs.stat(outputPath);
          const fileSizeMB = stats.size / (1024 * 1024);

          if (fileSizeMB > MAX_FILE_SIZE_MB) {
            await fs.unlink(outputPath);
            reject(new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`));
            return;
          }

          const info = await this.getVideoInfo(videoId);

          resolve({
            filePath: outputPath,
            fileSize: stats.size,
            duration: info.duration
          });
        } catch (error) {
          logger.error({ error, videoId }, 'Failed to verify download');
          reject(new Error('Failed to verify download'));
        }
      });
    });
  }

  private buildDownloadArgs(
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio,
    outputPath: string,
    retryCount: number
  ): string[] {
    const userAgent = this.getRandomUserAgent();
    
    const baseArgs = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-o', outputPath,
      '--no-playlist',
      '--ffmpeg-location', FFMPEG_PATH,
      '--no-check-certificates',
      '--user-agent', userAgent
    ];

    if (retryCount > 0) {
      baseArgs.push('--cookies-from-browser', 'chrome');
      baseArgs.push('--sleep-requests', '1');
    }

    if (format === 'mp3') {
      return [
        ...baseArgs,
        '-f', '140/bestaudio',
        '-x',
        '--audio-format', 'mp3'
      ];
    } else {
      const heightMatch = quality.match(/^(\d+)p/);
      const height = heightMatch ? parseInt(heightMatch[1]) : 360;
      
      const qualityMap: Record<number, string> = {
        144: '160/18',
        240: '133/18',
        360: '18',
        480: '135+140/18',
        720: '298+140/22/18',
        1080: '299+140/22/18',
        1440: '308+140/22/18',
        2160: '315+140/22/18'
      };
      
      const formatCode = qualityMap[height] || '18';
      
      return [
        ...baseArgs,
        '-f', formatCode
      ];
    }
  }
}