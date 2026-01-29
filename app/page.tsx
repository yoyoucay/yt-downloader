'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState('1080p');
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadInfo, setDownloadInfo] = useState<{
    downloaded?: string;
    total?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const availableQualities = selectedVideo?.availableFormats
    ? format === 'mp4'
      ? selectedVideo.availableFormats.video
      : selectedVideo.availableFormats.audio
    : undefined;

  // Always have valid quality - use defaults if backend doesn't provide any
  const defaultQualities = format === 'mp4' ? ['1080p', '720p'] : ['320kbps', '128kbps'];
  const qualities = availableQualities && availableQualities.length > 0
    ? availableQualities
    : defaultQualities;

  const hasValidQuality = Boolean(quality && quality !== 'No quality');

  useEffect(() => {
    if (format === 'mp4') {
      setQuality('1080p');
    } else {
      setQuality('320kbps');
    }
  }, [format]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedVideo(null);

    try {
      const data = await apiClient.search(query);

      if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
        setSelectedVideo(data.videos[0]);
      } else {
        setError('No videos found. Try a different search term.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      console.error('Search error:', err);
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

    try {
      const data = await apiClient.startDownload(selectedVideo.id, format, quality);
      setDownloadId(data.downloadId);
      setStatusMessage('Download started...');

      pollProgress(data.downloadId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Download failed: ' + errorMessage);
      setIsDownloading(false);
      setStatusMessage('');
      console.error('Download error:', err);
    }
  };

  const pollProgress = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const progress = await apiClient.getProgress(id);

        setDownloadProgress(progress.progress);
        setStatusMessage(`${progress.status}: ${progress.progress}%`);

        if (progress.status === 'completed') {
          clearInterval(interval);
          setStatusMessage('Download complete! Preparing file...');
          await downloadFile(id);
        } else if (progress.status === 'failed') {
          clearInterval(interval);
          setError(`Download failed: ${progress.error}`);
          setIsDownloading(false);
          setStatusMessage('');
        }
      } catch (error) {
        clearInterval(interval);
        setError('Failed to check download progress');
        setIsDownloading(false);
        setStatusMessage('');
        console.error('Progress poll error:', error);
      }
    }, 1000);
  };

  const downloadFile = async (id: string) => {
    try {
      const { blob, filename } = await apiClient.downloadFile(id);
      // Get the filename from backend or use video title as fallback
      let safeFilename = filename || selectedVideo?.title || 'download';
      // Sanitize the filename (remove emojis, invalid chars)
      safeFilename = sanitizeFilename(safeFilename);

      // Ensure it has the correct extension (.mp3 or .mp4)
      safeFilename = ensureExtension(safeFilename, format);

      // Rest of download logic...
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
      setDownloadId(null);

      setTimeout(() => {
        setStatusMessage('');
        setDownloadProgress(0);
      }, 3000);
    } catch (error) {
      setError('Failed to download file');
      setIsDownloading(false);
      setStatusMessage('');
      console.error('File download error:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="min-h-screen w-full max-w-3xl py-32 flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

          <PageHeader />

          <div className="flex flex-col gap-6 w-full sm:text-left">
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Download YouTube videos and audio with ease. High-quality MP3 and MP4 formats with real-time progress tracking.
            </p>

            <div className="w-full">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
            </div>

            {isSearching && <LoadingState />}

            {error && <ErrorDisplay message={error} />}

            <SearchResultsList
              results={searchResults}
              selectedVideo={selectedVideo}
              onSelectVideo={setSelectedVideo}
            />

            {selectedVideo && (
              <DownloadPanel
                selectedVideo={selectedVideo}
                format={format}
                quality={quality}
                availableQualities={availableQualities}
                hasValidQuality={hasValidQuality}
                isDownloading={isDownloading}
                downloadProgress={downloadProgress}
                downloadInfo={downloadInfo}
                statusMessage={statusMessage}
                onFormatChange={setFormat}
                onQualityChange={setQuality}
                onDownload={handleDownload}
              />
            )}

            {!isSearching && searchResults.length === 0 && !selectedVideo && !error && (
              <EmptyState />
            )}
          </div>

          {/* Footer spacer */}
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            {/* This empty div maintains the spacing structure */}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}