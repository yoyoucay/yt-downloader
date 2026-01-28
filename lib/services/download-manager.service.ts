import { randomUUID } from 'crypto';
import path from 'path';
import { mkdir, unlink, readdir, stat } from 'fs/promises';
import { YtDlpService } from './yt-dlp.service';
import { DOWNLOADS_DIR, CLEANUP_INTERVAL_MS } from '../config';
import { VideoId, Format, QualityVideo, QualityAudio } from '../validation';
import { sanitizeFilename } from '../utils/sanitize';
import { logger } from '../logger';

export interface DownloadProgress {
  downloadId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  filePath?: string;
  fileSize?: number;
}

class DownloadManager {
  private static instance: DownloadManager;
  private downloads: Map<string, DownloadProgress>;
  private ytDlpService: YtDlpService;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.downloads = new Map();
    this.ytDlpService = new YtDlpService();
    this.initializeCleanup();
  }

  static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  async startDownload(
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio
  ): Promise<{ downloadId: string; filePath: string }> {
    const downloadId = randomUUID();

    // Register download IMMEDIATELY in map
    this.downloads.set(downloadId, {
      downloadId,
      status: 'pending',
      progress: 0
    });

    logger.info({ downloadId, videoId }, 'Download registered in map');

    // Process async work in next tick
    process.nextTick(() => {
      this.initializeDownload(downloadId, videoId, format, quality).catch(error => {
        logger.error({ error, downloadId }, 'Download initialization failed');
      });
    });

    return { downloadId, filePath: '' };
  }

  private async initializeDownload(
    downloadId: string,
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio
  ): Promise<void> {
    try {
      await mkdir(DOWNLOADS_DIR, { recursive: true });

      const info = await this.ytDlpService.getVideoInfo(videoId);
      const filename = sanitizeFilename(`${info.title}.${format}`);
      const filePath = path.join(DOWNLOADS_DIR, `${downloadId}_${filename}`);

      this.updateProgress(downloadId, {
        status: 'downloading',
        progress: 0,
        filePath
      });

      await this.processDownload(downloadId, videoId, format, quality, filePath);
    } catch (error) {
      logger.error({ error, downloadId, videoId }, 'Failed to initialize download');
      this.updateProgress(downloadId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to prepare download'
      });
    }
  }

  getProgress(downloadId: string): DownloadProgress | null {
    return this.downloads.get(downloadId) || null;
  }

  private async processDownload(
    downloadId: string,
    videoId: VideoId,
    format: Format,
    quality: QualityVideo | QualityAudio,
    filePath: string
  ): Promise<void> {
    try {
      this.updateProgress(downloadId, { status: 'downloading', progress: 50 });

      const result = await this.ytDlpService.downloadVideo(videoId, format, quality, filePath);

      this.updateProgress(downloadId, {
        status: 'completed',
        progress: 100,
        filePath: result.filePath,
        fileSize: result.fileSize
      });

      logger.info({ downloadId, videoId, filePath }, 'Download completed');
    } catch (error) {
      logger.error({ error, downloadId, videoId }, 'Download failed');
      
      this.updateProgress(downloadId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private updateProgress(downloadId: string, updates: Partial<DownloadProgress>): void {
    const current = this.downloads.get(downloadId);
    if (current) {
      this.downloads.set(downloadId, { ...current, ...updates });
    }
  }

  private initializeCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldFiles();
    }, CLEANUP_INTERVAL_MS);
  }

  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await readdir(DOWNLOADS_DIR);
      const now = Date.now();
      const maxAge = 5 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(DOWNLOADS_DIR, file);
        const stats = await stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await unlink(filePath);
          logger.info({ filePath }, 'Cleaned up old file');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Cleanup failed');
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const downloadManagerService = DownloadManager.getInstance();