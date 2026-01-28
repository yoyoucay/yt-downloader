import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YtDlpService } from '@/lib/services/yt-dlp.service';
import { EventEmitter } from 'events';

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

describe('YtDlpService', () => {
  let service: YtDlpService;
  let mockProcess: EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };

  beforeEach(() => {
    service = new YtDlpService();
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    mockProcess = Object.assign(new EventEmitter(), { stdout, stderr });
  });

  describe('getVideoInfo', () => {
    it('should parse video info successfully', async () => {
      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const mockInfo = {
        id: 'dQw4w9WgXcQ',
        title: 'Test Video',
        duration: 212,
        thumbnail: 'https://example.com/thumb.jpg',
        uploader: 'Test Channel',
        view_count: 1000000,
        formats: []
      };

      const promise = service.getVideoInfo('dQw4w9WgXcQ');

      mockProcess.stdout.emit('data', JSON.stringify(mockInfo));
      mockProcess.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        id: 'dQw4w9WgXcQ',
        title: 'Test Video',
        duration: 212,
        thumbnail: 'https://example.com/thumb.jpg',
        channel: 'Test Channel',
        viewCount: 1000000,
        availableFormats: {
          video: ['360p', '480p', '720p', '1080p'],
          audio: ['128kbps', '192kbps', '256kbps', '320kbps']
        }
      });
    });

    it('should reject on spawn error', async () => {
      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const promise = service.getVideoInfo('dQw4w9WgXcQ');

      mockProcess.stderr.emit('data', 'Error');
      mockProcess.emit('close', 1);

      await expect(promise).rejects.toThrow('Failed to fetch video information');
    });
  });
});