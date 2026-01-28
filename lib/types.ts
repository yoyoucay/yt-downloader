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
  status: 'starting' | 'preparing' | 'downloading' | 'complete' | 'error';
  message?: string;
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
  downloadUrl?: string;
  filename?: string;
  filepath?: string;
}
