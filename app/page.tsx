'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { FormatSelector } from './components/FormatSelector';
import { QualitySelector } from './components/QualitySelector';
import { ProgressBar } from './components/ProgressBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VideoResult } from '@/lib/types';
import { Download, Loader2, Youtube, AlertCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState('720p');
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

  useEffect(() => {
    if (format === 'mp4') {
      setQuality('720p');
    } else {
      setQuality('192kbps');
    }
  }, [format]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedVideo(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();

      if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
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
    if (!selectedVideo) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);
    setStatusMessage('Initiating download...');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          format,
          quality
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download initiation failed');
      }

      const data = await response.json();
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
        const response = await fetch(`/api/download/${id}/progress`);

        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const progress = await response.json();

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
      const response = await fetch(`/api/download/${id}`);

      if (!response.ok) {
        throw new Error('File download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedVideo?.title || 'download';
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

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <svg 
                role="img" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 fill-red-600 dark:fill-red-500"
              >
                <title>YouTube</title>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent tracking-tight">
              YT Downloader
            </h1>
          </div>

          <div className="flex flex-col gap-6 w-full sm:text-left">
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Download YouTube videos and audio with ease. High-quality MP3 and MP4 formats with real-time progress tracking.
            </p>

            <div className="w-full">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
            </div>

            {isSearching && (
              <div className="flex flex-col justify-center items-center py-8">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <div className="absolute inset-0 w-10 h-10 border-2 border-indigo-200 dark:border-indigo-900 rounded-full" />
                </div>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium text-sm">Searching YouTube...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1 text-sm">Error occurred</h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Search Results
                </h2>
                <div className="space-y-3">
                  {searchResults.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSelect={setSelectedVideo}
                      isSelected={selectedVideo?.id === video.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Download Options Panel */}
            {selectedVideo && (
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
                  <FormatSelector selected={format} onChange={setFormat} />
                  <QualitySelector
                    format={format}
                    selected={quality}
                    onChange={setQuality}
                    availableQualities={
                      selectedVideo?.availableFormats
                        ? format === 'mp4'
                          ? selectedVideo.availableFormats.video
                          : selectedVideo.availableFormats.audio
                        : undefined
                    }
                  />
                </div>

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
                  onClick={handleDownload}
                  disabled={isDownloading}
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
                      <span>Start Download</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isSearching && searchResults.length === 0 && !selectedVideo && !error && (
              <div className="text-center py-12 sm:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-700">
                  <Youtube className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Ready to download
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm leading-relaxed">
                  Search for a video or paste a YouTube URL to get started
                </p>
              </div>
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