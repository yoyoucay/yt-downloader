'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchBar } from './components/SearchBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VideoResult } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

import { PageHeader } from './_components/PageHeader';
import { LoadingState } from './_components/LoadingState';
import { ErrorDisplay } from './_components/ErrorDisplay';
import { SearchResultsList } from './_components/SearchResultsList';
import { DownloadPanel } from './_components/DownloadPanel';
import { EmptyState } from './_components/EmptyState';
import { sanitizeFilename, ensureExtension } from '@/lib/utils/sanitize-filename';

interface HistoryEntry {
  num: number;
  title: string;
  format: string;
  status: 'ok' | 'err' | 'queue';
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState('1080p');
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const historyCounterRef = useRef(1);
  const currentHistoryNumRef = useRef<number | null>(null);

  const availableQualities = selectedVideo?.availableFormats
    ? format === 'mp4'
      ? selectedVideo.availableFormats.video
      : selectedVideo.availableFormats.audio
    : undefined;

  const hasValidQuality = Boolean(quality && quality !== 'No quality');

  useEffect(() => {
    if (format === 'mp4') {
      setQuality('1080p');
    } else {
      setQuality('320kbps');
    }
  }, [format]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, []);

  const handleSearch = async (query: string) => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedVideo(null);

    try {
      const data = await apiClient.search(query, controller.signal);

      if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
        setSelectedVideo(data.videos[0]);
      } else {
        setError('No videos found. Try a different search term.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedVideo || !hasValidQuality) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);
    setStatusMessage('Initiating download...');

    const num = historyCounterRef.current++;
    currentHistoryNumRef.current = num;
    setHistory(prev => [{
      num,
      title: selectedVideo.title,
      format: `${format.toUpperCase()} · ${quality}`,
      status: 'queue',
    }, ...prev]);

    try {
      const data = await apiClient.startDownload(selectedVideo.id, format, quality);
      setStatusMessage('Download started...');

      pollProgress(data.downloadId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Download failed: ' + errorMessage);
      setIsDownloading(false);
      setStatusMessage('');
      setHistory(prev => prev.map(h => h.num === num ? { ...h, status: 'err' } : h));
    }
  };

  const pollProgress = (id: string) => {
    const MAX_RETRIES = 120;
    let retries = 0;

    intervalRef.current = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      const stopPolling = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      const markHistoryErr = () => {
        setHistory(prev => prev.map(h =>
          h.num === currentHistoryNumRef.current ? { ...h, status: 'err' } : h
        ));
      };

      try {
        retries++;
        if (retries > MAX_RETRIES) {
          stopPolling();
          setError('Download timed out. Please try again.');
          setIsDownloading(false);
          setStatusMessage('');
          markHistoryErr();
          return;
        }

        const progress = await apiClient.getProgress(id);
        setDownloadProgress(progress.progress);
        setStatusMessage(`${progress.status}: ${progress.progress}%`);

        if (progress.status === 'completed') {
          stopPolling();
          setStatusMessage('Download complete! Preparing file...');
          await downloadFile(id);
        } else if (progress.status === 'failed') {
          stopPolling();
          setError(`Download failed: ${progress.error}`);
          setIsDownloading(false);
          setStatusMessage('');
          markHistoryErr();
        }
      } catch (error) {
        stopPolling();
        setError('Failed to check download progress');
        setIsDownloading(false);
        setStatusMessage('');
        markHistoryErr();
        console.error('Progress poll error:', error);
      } finally {
        isPollingRef.current = false;
      }
    }, 1000);
  };

  const downloadFile = async (id: string) => {
    try {
      const { blob, filename } = await apiClient.downloadFile(id);
      let safeFilename = filename || selectedVideo?.title || 'download';
      safeFilename = sanitizeFilename(safeFilename);
      safeFilename = ensureExtension(safeFilename, format);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatusMessage('Download complete!');
      setIsDownloading(false);
      setHistory(prev => prev.map(h =>
        h.num === currentHistoryNumRef.current ? { ...h, status: 'ok' } : h
      ));

      setTimeout(() => {
        setStatusMessage('');
        setDownloadProgress(0);
      }, 3000);
    } catch (error) {
      setError('Failed to download file');
      setIsDownloading(false);
      setStatusMessage('');
      setHistory(prev => prev.map(h =>
        h.num === currentHistoryNumRef.current ? { ...h, status: 'err' } : h
      ));
      console.error('File download error:', error);
    }
  };

  const hasResults = searchResults.length > 0;

  return (
    <ErrorBoundary>
      <div className="s7-shell">

        <PageHeader />

        {/* Hero */}
        <section className="s7-hero">
          <div>
            <h1>RIP THE <span className="s7-glitch">FEED</span>.<br />KEEP THE SIGNAL.</h1>
            <p>
              Paste a link or scan the index. Pull video at up to <b>4K</b>, audio at up to <b>320kbps</b>,
              and watch the bytes arrive in real time. No accounts, no trackers — just files on disk.
            </p>
          </div>
          <div className="s7-hero-meta">
            <div className="s7-hero-meta-row">
              <span>// SESSION</span>
              <span className="val">A7F3-2B91</span>
            </div>
            <div className="s7-hero-meta-row">
              <span>// FORMATS</span>
              <span className="val">MP4 · MP3</span>
            </div>
            <div className="s7-hero-meta-row">
              <span>// RESULTS</span>
              <span className="val cyan">{searchResults.length > 0 ? `${searchResults.length} HITS` : 'NONE'}</span>
            </div>
            <div className="s7-hero-meta-row">
              <span>// STATUS</span>
              <span className={`val ${isDownloading ? 'cyan' : 'pink'}`}>
                {isDownloading ? 'DOWNLOADING' : isSearching ? 'SCANNING' : 'READY'}
              </span>
            </div>
          </div>
        </section>

        {/* Search */}
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />

        {/* Loading */}
        {isSearching && <LoadingState />}

        {/* Error (search-level) */}
        {error && !isDownloading && !hasResults && (
          <ErrorDisplay message={error} />
        )}

        {/* Results + Panel */}
        {hasResults ? (
          <div className="s7-work">
            <SearchResultsList
              results={searchResults}
              selectedVideo={selectedVideo}
              onSelectVideo={setSelectedVideo}
            />

            {selectedVideo && (
              <aside>
                <DownloadPanel
                  selectedVideo={selectedVideo}
                  format={format}
                  quality={quality}
                  availableQualities={availableQualities}
                  hasValidQuality={hasValidQuality}
                  isDownloading={isDownloading}
                  downloadProgress={downloadProgress}
                  downloadInfo={null}
                  statusMessage={statusMessage}
                  error={isDownloading || hasResults ? error : null}
                  onFormatChange={setFormat}
                  onQualityChange={setQuality}
                  onDownload={handleDownload}
                />
              </aside>
            )}
          </div>
        ) : (
          !isSearching && !error && <EmptyState />
        )}

        {/* Rip Log */}
        <section className="s7-history">
          <div className="s7-history-head">
            <span>// 04 &nbsp; RIP LOG</span>
            {history.length > 0 && (
              <span
                style={{ cursor: 'pointer', fontSize: '10px', color: 'var(--text-mute)' }}
                onClick={() => setHistory([])}
              >
                CLEAR ALL
              </span>
            )}
          </div>
          {history.length === 0 ? (
            <div className="s7-empty-history">NO ENTRIES</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th>TITLE</th>
                  <th style={{ width: '120px' }}>FORMAT</th>
                  <th style={{ width: '90px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.num}>
                    <td style={{ color: 'var(--text-mute)' }}>{String(h.num).padStart(2, '0')}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.title}
                    </td>
                    <td className="f">{h.format}</td>
                    <td className={`s ${h.status}`}>
                      {h.status === 'ok' && '✓ OK'}
                      {h.status === 'err' && '✕ ERR'}
                      {h.status === 'queue' && '▶ ACTIVE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="s7-footer">
          <span>
            &copy; SECTOR<span className="pink">·</span>7 &mdash;{' '}
            <span className="cyan">NO TRACKERS</span> &middot;{' '}
            <span className="pink">NO ACCOUNTS</span> &middot; LOCAL FIRST
          </span>
          <span>BUILD 0x3.2.1 · NODE//07</span>
        </footer>

      </div>
    </ErrorBoundary>
  );
}
