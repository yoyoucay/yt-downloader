import path from 'path';

export const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');
export const MAX_FILE_SIZE_MB = 500;
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_MAX_REQUESTS = 10;
export const CLEANUP_INTERVAL_MS = 300000;
export const YT_DLP_PATH = 'C:\\Users\\beemo\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe';
export const FFMPEG_PATH = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin';
export const DEFAULT_VIDEO_QUALITY = '720p';
export const DEFAULT_AUDIO_QUALITY = '192kbps';