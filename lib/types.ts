export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
  url: string;
  availableFormats?: {
    video: string[];
    audio: string[];
  };
}

export interface DownloadOptions {
  videoId: string;
  format: 'mp3' | 'mp4';
  quality: string;
}

export interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface DownloadProgress {
  downloadId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error: string | null;
  filePath: string | null;
}
