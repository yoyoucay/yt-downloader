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

export class YtDlpService {
  async getVideoInfo(videoId: VideoId): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-playlist',
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
    outputPath: string
  ): Promise<DownloadResult> {
    return new Promise((resolve, reject) => {
      const args = this.buildDownloadArgs(videoId, format, quality, outputPath);
      
      logger.info({ videoId, format, quality, outputPath }, 'Starting download');

      const proc = spawn(YT_DLP_PATH, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', async (code) => {
        if (code !== 0) {
          logger.error({ videoId, stderr, code }, 'Download failed');
          reject(new Error('Download failed'));
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
    outputPath: string
  ): string[] {
    const baseArgs = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-o', outputPath,
      '--no-playlist',
      '--no-check-certificates'
    ];

    if (format === 'mp3') {
      return [
        ...baseArgs,
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '--extract-audio',
        '--audio-format', 'mp3'
      ];
    } else {
      const formatMap: Record<string, string> = {
        '360p': '18',
        '480p': '135+140/18',
        '720p': '22',
        '1080p': '137+140',
        '1440p': '264+140',
        '2160p': '266+140'
      };
      
      const formatCode = formatMap[quality as QualityVideo] || '18';
      
      return [
        ...baseArgs,
        '-f', formatCode
      ];
    }
  }
}