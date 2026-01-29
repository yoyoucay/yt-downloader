/**
 * API Client for communicating with the backend server
 * Uses NEXT_PUBLIC_API_URL environment variable
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiError {
  error: string;
  details?: unknown;
}

interface DownloadFileResponse {
  blob: Blob;
  filename: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If parsing error response fails, use default message
      }
      throw new Error(errorMessage);
    }

    // Handle blob responses (file downloads)
    const contentType = response.headers.get('content-type') || '';
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/x-mpegURL')
    ) {
      return response.blob() as Promise<T>;
    }

    return response.json();
  }

  /**
   * Extract filename from Content-Disposition header
   */
  private extractFilename(response: Response): string {
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log('Content-Disposition header:', contentDisposition); // DEBUG
    
    if (contentDisposition) {
      // Try to extract filename from: attachment; filename="video.mp4"
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        const extracted = filenameMatch[1].replace(/['"]/g, '');
        console.log('Extracted filename:', extracted); // DEBUG
        return extracted;
      }
      
      // Try UTF-8 encoding: filename*=UTF-8''video.mp4
      const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (filenameStarMatch && filenameStarMatch[1]) {
        const extracted = decodeURIComponent(filenameStarMatch[1]);
        console.log('Extracted UTF-8 filename:', extracted); // DEBUG
        return extracted;
      }
    }
    
    console.log('No filename found in headers, returning fallback'); // DEBUG
    // Fallback to generic name
    return '';
  }

  /**
   * Search for YouTube videos
   * @param query - Search term or YouTube URL
   */
  async search(query: string) {
    const url = `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<{
      videos: Array<{
        id: string;
        title: string;
        thumbnail: string;
        channel: string;
        duration: string;
        url: string;
        availableFormats?: {
          video: string[];
          audio: string[];
        };
      }>;
    }>(response);
  }

  /**
   * Initiate a download
   * @param videoId - YouTube video ID
   * @param format - Download format (mp3 or mp4)
   * @param quality - Quality setting
   */
  async startDownload(videoId: string, format: 'mp3' | 'mp4', quality: string) {
    const url = `${this.baseUrl}/api/download`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, format, quality }),
    });

    return this.handleResponse<{
      downloadId: string;
      status: string;
    }>(response);
  }

  /**
   * Check download progress
   * @param downloadId - Unique download identifier
   */
  async getProgress(downloadId: string) {
    const url = `${this.baseUrl}/api/download/${downloadId}/progress`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<{
      downloadId: string;
      status: 'pending' | 'downloading' | 'completed' | 'failed';
      progress: number;
      error: string | null;
      filePath: string | null;
    }>(response);
  }

  /**
   * Download the completed file
   * @param downloadId - Unique download identifier
   * @returns Object with blob and filename
   */
  async downloadFile(downloadId: string): Promise<DownloadFileResponse> {
    const url = `${this.baseUrl}/api/download/${downloadId}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If parsing fails, use default message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const filename = this.extractFilename(response);

    return { blob, filename };
  }

  /**
   * Get playlist information (if implemented on backend)
   * @param playlistId - YouTube playlist ID
   */
  async getPlaylist(playlistId: string) {
    const url = `${this.baseUrl}/api/playlist?id=${encodeURIComponent(playlistId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse<{
      videos: Array<{
        id: string;
        title: string;
        thumbnail: string;
        duration: string;
      }>;
    }>(response);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export for testing or custom instances
export { ApiClient };