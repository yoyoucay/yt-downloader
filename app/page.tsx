'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { FormatSelector } from './components/FormatSelector';
import { QualitySelector } from './components/QualitySelector';
import { ProgressBar } from './components/ProgressBar';
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
    speed?: string;
    eta?: string;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

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
    setDownloadUrl(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
      } else {
        setError('No videos found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search. Please check your internet connection and try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedVideo) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadUrl(null);
    setError(null);
    setStatusMessage('Starting download...');

    console.log({ selectedVideo, format, quality });

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          format,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error('Download request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.status === 'starting' || data.status === 'preparing') {
                setStatusMessage(data.message || 'Preparing...');
                setDownloadProgress(data.percent || 0);
              } else if (data.status === 'downloading') {
                setStatusMessage('Downloading...');
                setDownloadProgress(data.percent);
                setDownloadInfo(data);
              } else if (data.status === 'complete') {
                setStatusMessage('Download complete!');
                setDownloadProgress(100);
                setDownloadUrl(data.downloadUrl);
                setIsDownloading(false);
              } else if (data.status === 'error') {
                setError(data.message || 'Download failed');
                setIsDownloading(false);
                setStatusMessage('');
              }
            } catch (parseError) {
              console.error('Parse error:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error. Please try again.';
      setError('Download failed: ' + errorMessage);
      setIsDownloading(false);
      setStatusMessage('');
      console.error('Download error:', err);
    }
  };

  const handleDownloadFile = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
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

        {/* Search Section */}
        <section className="mb-10">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </section>

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col justify-center items-center py-16">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Searching YouTube...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error</h3>
              <p className="text-red-700 dark:text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Search Results */}
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

        {/* Download Controls */}
        {selectedVideo && (
          <section className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Download Options
              </h2>

              {/* Selected Video Info */}
              <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-white mb-2 text-lg leading-snug">
                  {selectedVideo.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  {selectedVideo.channel}
                </p>
              </div>

              {/* Format and Quality Selectors */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <FormatSelector selected={format} onChange={setFormat} />
                <QualitySelector
                  format={format}
                  selected={quality}
                  onChange={setQuality}
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-sm font-medium">
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
              {downloadUrl ? (
                <button
                  onClick={handleDownloadFile}
                  className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <CheckCircle className="w-5 h-5" />
                  Download Complete - Click to Save File
                </button>
              ) : (
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
              )}
            </div>
          </section>
        )}

        {/* Empty State */}
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
  );
}