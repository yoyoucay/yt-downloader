import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { FormatSelector } from '../components/FormatSelector';
import { QualitySelector } from '../components/QualitySelector';
import { ProgressBar } from '../components/ProgressBar';
import { VideoResult } from '@/lib/types';

interface DownloadPanelProps {
  selectedVideo: VideoResult;
  format: 'mp3' | 'mp4';
  quality: string;
  availableQualities: string[] | undefined;
  hasValidQuality: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadInfo: { downloaded?: string; total?: string } | null;
  statusMessage: string;
  onFormatChange: (format: 'mp3' | 'mp4') => void;
  onQualityChange: (quality: string) => void;
  onDownload: () => void;
}

export function DownloadPanel({
  selectedVideo,
  format,
  quality,
  availableQualities,
  hasValidQuality,
  isDownloading,
  downloadProgress,
  downloadInfo,
  statusMessage,
  onFormatChange,
  onQualityChange,
  onDownload,
}: DownloadPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Download Options
      </h2>

      {/* Selected Video Info */}
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1.5 text-sm line-clamp-2">
          {selectedVideo.title}
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {selectedVideo.channel}
        </p>
      </div>

      {/* Format & Quality Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FormatSelector selected={format} onChange={onFormatChange} />
        <QualitySelector
          format={format}
          selected={quality}
          onChange={onQualityChange}
          availableQualities={availableQualities}
        />
      </div>

      {/* Warning message when no quality available */}
      {!hasValidQuality && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-900 dark:text-amber-300 text-xs font-medium">
            No quality options available for this video. Please select another video.
          </p>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-indigo-900 dark:text-indigo-300 text-sm font-medium">
          {statusMessage}
        </div>
      )}

      {/* Progress Bar */}
      {isDownloading && (
        <div className="mb-6">
          <ProgressBar
            percent={downloadProgress}
            downloaded={downloadInfo?.downloaded}
            total={downloadInfo?.total}
          />
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={isDownloading || !hasValidQuality}
        className="w-full py-3.5 px-6 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 text-white font-medium rounded-xl transition-all shadow-lg disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>{hasValidQuality ? 'Start Download' : 'No Quality Available'}</span>
          </>
        )}
      </button>
    </div>
  );
}