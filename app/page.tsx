'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { FormatSelector } from './components/FormatSelector';
import { QualitySelector } from './components/QualitySelector';
import { ProgressBar } from './components/ProgressBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VideoResult } from '@/lib/types';
import { Download, Loader2, Youtube, CheckCircle, AlertCircle } from 'lucide-react';

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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          
          <header className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Youtube className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                YouTube Downloader
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Search and download YouTube videos in MP3 or MP4 format with real-time progress tracking
            </p>
          </header>

          <section className="mb-10">
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </section>

          {isSearching && (
            <div className="flex flex-col justify-center items-center py-16">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Searching YouTube...</p>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Search Results
              </h2>
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
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

          {selectedVideo && (
            <section className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Download Options
                </h2>

                <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg leading-snug">
                    {selectedVideo.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    {selectedVideo.channel}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
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

                {statusMessage && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-sm font-medium">
                    {statusMessage}
                  </div>
                )}

                {isDownloading && (
                  <div className="mb-6">
                    <ProgressBar
                      percent={downloadProgress}
                      downloaded={downloadInfo?.downloaded}
                      total={downloadInfo?.total}
                    />
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Start Download
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {!isSearching && searchResults.length === 0 && !selectedVideo && !error && (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start by searching for a video
              </h3>
              <p className="text-gray-500 dark:text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                Enter a search term or paste a YouTube URL in the search bar above
              </p>
            </div>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}