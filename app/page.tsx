'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { FormatSelector } from './components/FormatSelector';
import { QualitySelector } from './components/QualitySelector';
import { ProgressBar } from './components/ProgressBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VideoResult } from '@/lib/types';
import { Download, Loader2, Youtube, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

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
      <main className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Background gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-violet-950/20 pointer-events-none" />
        
        <div className="relative container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
          
          {/* Hero Header */}
          <header className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="relative">
                <Youtube className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
                <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-500 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent tracking-tight">
                YT Downloader
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Download YouTube videos and audio with ease. High-quality MP3 and MP4 formats with real-time progress tracking.
            </p>
          </header>

          {/* Search Section */}
          <section className="mb-12 animate-fade-in">
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </section>

          {/* Loading State */}
          {isSearching && (
            <div className="flex flex-col justify-center items-center py-20 animate-scale-in">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-indigo-200 dark:border-indigo-900 rounded-full" />
              </div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium text-sm">Searching YouTube...</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 shadow-sm backdrop-blur-sm animate-slide-in">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1 text-sm">Error occurred</h3>
                <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <section className="mb-12 animate-scale-in">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">
                Search Results
              </h2>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
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
            </section>
          )}

          {/* Download Options Panel */}
          {selectedVideo && (
            <section className="max-w-2xl mx-auto animate-scale-in">
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-none overflow-hidden">
                {/* Subtle gradient accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">
                    Download Options
                  </h2>

                  {/* Selected Video Info */}
                  <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1.5 text-sm leading-snug line-clamp-2">
                      {selectedVideo.title}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {selectedVideo.channel}
                    </p>
                  </div>

                  {/* Format & Quality Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
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
                    <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-indigo-900 dark:text-indigo-300 text-sm font-medium backdrop-blur-sm">
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
                    className="relative w-full py-3.5 px-6 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 disabled:shadow-none active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2.5 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
              </div>
            </section>
          )}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && !selectedVideo && !error && (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-700">
                <Youtube className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Ready to download
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                Search for a video or paste a YouTube URL to get started
              </p>
            </div>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}