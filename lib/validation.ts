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

export const QualityVideoSchema = z.enum([
  "144p",
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
]);

export const QualityAudioSchema = z.enum([
  "128kbps",
  "192kbps",
  "256kbps",
  "320kbps",
]);

export const DownloadRequestSchema = z.object({
  videoId: VideoIdSchema,
  format: FormatSchema,
  quality: z.union([QualityVideoSchema, QualityAudioSchema]),
});

export const SearchRequestSchema = z.object({
  query: SearchQuerySchema,
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type VideoId = z.infer<typeof VideoIdSchema>;
export type Format = z.infer<typeof FormatSchema>;
export type QualityVideo = z.infer<typeof QualityVideoSchema>;
export type QualityAudio = z.infer<typeof QualityAudioSchema>;
export type DownloadRequest = z.infer<typeof DownloadRequestSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
