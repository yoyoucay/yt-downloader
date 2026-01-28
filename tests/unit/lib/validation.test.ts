import { describe, it, expect } from 'vitest';
import {
  SearchQuerySchema,
  VideoIdSchema,
  FormatSchema,
  QualityVideoSchema,
  QualityAudioSchema,
  DownloadRequestSchema,
  SearchRequestSchema
} from '@/lib/validation';

describe('SearchQuerySchema', () => {
  it('should validate valid search query', () => {
    const result = SearchQuerySchema.safeParse('  test query  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test query');
    }
  });

  it('should reject empty query', () => {
    const result = SearchQuerySchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should reject query exceeding 200 chars', () => {
    const result = SearchQuerySchema.safeParse('a'.repeat(201));
    expect(result.success).toBe(false);
  });
});

describe('VideoIdSchema', () => {
  it('should validate valid video ID', () => {
    const result = VideoIdSchema.safeParse('dQw4w9WgXcQ');
    expect(result.success).toBe(true);
  });

  it('should reject invalid length', () => {
    const result = VideoIdSchema.safeParse('short');
    expect(result.success).toBe(false);
  });

  it('should reject invalid characters', () => {
    const result = VideoIdSchema.safeParse('invalid@id!');
    expect(result.success).toBe(false);
  });
});

describe('FormatSchema', () => {
  it('should validate mp3', () => {
    const result = FormatSchema.safeParse('mp3');
    expect(result.success).toBe(true);
  });

  it('should validate mp4', () => {
    const result = FormatSchema.safeParse('mp4');
    expect(result.success).toBe(true);
  });

  it('should reject invalid format', () => {
    const result = FormatSchema.safeParse('avi');
    expect(result.success).toBe(false);
  });
});

describe('QualityVideoSchema', () => {
  it('should validate all video qualities', () => {
    const qualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
    qualities.forEach(quality => {
      const result = QualityVideoSchema.safeParse(quality);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid quality', () => {
    const result = QualityVideoSchema.safeParse('4K');
    expect(result.success).toBe(false);
  });
});

describe('QualityAudioSchema', () => {
  it('should validate all audio qualities', () => {
    const qualities = ['128kbps', '192kbps', '256kbps', '320kbps'];
    qualities.forEach(quality => {
      const result = QualityAudioSchema.safeParse(quality);
      expect(result.success).toBe(true);
    });
  });
});

describe('DownloadRequestSchema', () => {
  it('should validate complete download request', () => {
    const result = DownloadRequestSchema.safeParse({
      videoId: 'dQw4w9WgXcQ',
      format: 'mp4',
      quality: '720p'
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid request', () => {
    const result = DownloadRequestSchema.safeParse({
      videoId: 'short',
      format: 'invalid',
      quality: 'bad'
    });
    expect(result.success).toBe(false);
  });
});

describe('SearchRequestSchema', () => {
  it('should validate search request', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'test search'
    });
    expect(result.success).toBe(true);
  });
});