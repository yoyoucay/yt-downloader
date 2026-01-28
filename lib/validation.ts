import { z } from "zod";

export const SearchQuerySchema = z
  .string()
  .min(1, "Search query cannot be empty")
  .max(200, "Search query too long")
  .transform((val) => val.trim());

export const VideoIdSchema = z
  .string()
  .length(11, "Invalid video ID")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format");

export const FormatSchema = z.enum(["mp3", "mp4"]);

// Flexible regex patterns to accept YouTube's dynamic qualities
export const QualityVideoSchema = z
  .string()
  .regex(/^\d+p(\d+)?$/, "Invalid video quality format. Expected format: 360p, 720p60, etc.");

export const QualityAudioSchema = z
  .string()
  .regex(/^\d+kbps$/, "Invalid audio quality format. Expected format: 128kbps, 192kbps, etc.");

// Conditional validation based on format
export const DownloadRequestSchema = z.object({
  videoId: VideoIdSchema,
  format: FormatSchema,
  quality: z.string(),
}).refine(
  (data) => {
    if (data.format === 'mp3') {
      return QualityAudioSchema.safeParse(data.quality).success;
    } else {
      return QualityVideoSchema.safeParse(data.quality).success;
    }
  },
  (data) => ({
    message: data.format === 'mp3'
      ? 'Invalid audio quality. Expected format like: 128kbps, 192kbps, 320kbps'
      : 'Invalid video quality. Expected format like: 360p, 720p, 1080p',
    path: ['quality']
  })
);

export const SearchRequestSchema = z.object({
  query: SearchQuerySchema,
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type VideoId = z.infer<typeof VideoIdSchema>;
export type Format = z.infer<typeof FormatSchema>;
export type QualityVideo = string; // Now accepts any valid format
export type QualityAudio = string; // Now accepts any valid format
export type DownloadRequest = z.infer<typeof DownloadRequestSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
