Write-Host "Creating lib/config.ts..." -ForegroundColor Green
@"
import path from 'path';

export const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');
export const MAX_FILE_SIZE_MB = 500;
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_MAX_REQUESTS = 10;
export const CLEANUP_INTERVAL_MS = 300000;
export const YT_DLP_PATH = 'yt-dlp';
export const DEFAULT_VIDEO_QUALITY = '720p';
export const DEFAULT_AUDIO_QUALITY = '192kbps';
"@ | Out-File -FilePath "lib/config.ts" -Encoding UTF8

Write-Host "File created: lib/config.ts" -ForegroundColor Cyan
