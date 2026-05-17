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
  error: string | null;
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
  error,
  onFormatChange,
  onQualityChange,
  onDownload,
}: DownloadPanelProps) {
  return (
    <div className="s7-panel">
      <div className="s7-panel-head">
        <span className="title">// 03 &nbsp; RIP CONFIG</span>
        <span className="s7-led"><i /><i /><i /></span>
      </div>
      <div className="s7-panel-body">

        <div className="s7-target">
          <div className="k">// TARGET</div>
          <div className="v">{selectedVideo.title}</div>
          <div className="sub">{selectedVideo.channel} · {selectedVideo.duration}</div>
        </div>

        <FormatSelector
          selected={format}
          onChange={onFormatChange}
          disabled={isDownloading}
        />

        <QualitySelector
          format={format}
          selected={quality}
          onChange={onQualityChange}
          availableQualities={availableQualities}
          disabled={isDownloading}
        />

        {error && (
          <div className="s7-status-err">
            &gt; ERR :: {error}
          </div>
        )}

        {statusMessage && !error && (
          <div className="s7-status">
            <span>&gt; {statusMessage}</span>
            <span className="s7-blink"> _</span>
          </div>
        )}

        {isDownloading && (
          <ProgressBar
            percent={downloadProgress}
            downloaded={downloadInfo?.downloaded}
            total={downloadInfo?.total}
          />
        )}

        <button
          onClick={onDownload}
          disabled={isDownloading || !hasValidQuality}
          className="s7-cta"
        >
          {isDownloading ? (
            '▶ DOWNLOADING...'
          ) : (
            <><span style={{ marginRight: '8px' }}>▼▼▼</span>EXECUTE DOWNLOAD</>
          )}
        </button>

      </div>
    </div>
  );
}
