import { NextRequest } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

// Helper to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let { videoId, format, quality } = await request.json();

  if (!videoId || !format) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial message
        const initialData = `data: ${JSON.stringify({
          status: 'starting',
          message: 'Fetching video information...',
          percent: 0,
        })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        // Verify video availability
        if (!ytdl.validateURL(videoUrl)) {
          throw new Error('Invalid YouTube URL');
        }

        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        const title = sanitizeFilename(info.videoDetails.title);

        const prepareData = `data: ${JSON.stringify({
          status: 'preparing',
          message: 'Preparing download...',
          percent: 5,
        })}\n\n`;
        controller.enqueue(encoder.encode(prepareData));

        if (format === 'mp4') {
          // Download video
          let qualityOption: ytdl.videoFormat | string = 'highestvideo';
          
          if (quality === '1080p') qualityOption = 'highestvideo';
          else if (quality === '720p') qualityOption = 'highestvideo';
          else if (quality === '480p') qualityOption = 'lowestvideo';
          else if (quality === '360p') qualityOption = 'lowestvideo';

          const videoStream = ytdl(videoUrl, {
            quality: qualityOption as any,
            filter: format => format.hasVideo && format.hasAudio,
          });

          let downloadedBytes = 0;
          let totalBytes = 0;

          videoStream.on('info', (info, format) => {
            totalBytes = parseInt(format.contentLength || '0');
          });

          videoStream.on('progress', (chunkLength, downloaded, total) => {
            downloadedBytes = downloaded;
            totalBytes = total;
            const percent = Math.min((downloaded / total) * 100, 99);

            const progressData = `data: ${JSON.stringify({
              status: 'downloading',
              percent: percent,
              downloaded: formatBytes(downloaded),
              total: formatBytes(total),
            })}\n\n`;
            controller.enqueue(encoder.encode(progressData));
          });

          const chunks: Buffer[] = [];
          
          videoStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          videoStream.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const filename = `${title}.mp4`;
              const filepath = path.join(os.tmpdir(), `yt_${Date.now()}_${filename}`);

              await writeFile(filepath, buffer);

              const completeData = `data: ${JSON.stringify({
                status: 'complete',
                percent: 100,
                filename,
                filepath,
                downloadUrl: `/api/download/file?path=${encodeURIComponent(filepath)}&name=${encodeURIComponent(filename)}`,
              })}\n\n`;
              controller.enqueue(encoder.encode(completeData));
              controller.close();

              // Cleanup after 10 minutes
              setTimeout(async () => {
                try {
                  await unlink(filepath);
                } catch (e) {
                  console.error('Cleanup error:', e);
                }
              }, 600000);
            } catch (error: any) {
              const errorData = `data: ${JSON.stringify({
                status: 'error',
                message: 'Failed to save file: ' + error.message,
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          });

          videoStream.on('error', (error) => {
            console.error('Download error:', error);
            const errorData = `data: ${JSON.stringify({
              status: 'error',
              message: 'Download failed: ' + error.message,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          });

        } else {
          // MP3 download
          const audioStream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly',
          });

          let downloadedBytes = 0;
          let totalBytes = 0;

          audioStream.on('info', (info, format) => {
            totalBytes = parseInt(format.contentLength || '0');
          });

          audioStream.on('progress', (chunkLength, downloaded, total) => {
            downloadedBytes = downloaded;
            totalBytes = total;
            const percent = Math.min((downloaded / total) * 100, 99);

            const progressData = `data: ${JSON.stringify({
              status: 'downloading',
              percent: percent,
              downloaded: formatBytes(downloaded),
              total: formatBytes(total),
            })}\n\n`;
            controller.enqueue(encoder.encode(progressData));
          });

          const chunks: Buffer[] = [];
          
          audioStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          audioStream.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const filename = `${title}.mp3`;
              const filepath = path.join(os.tmpdir(), `yt_${Date.now()}_${filename}`);

              await writeFile(filepath, buffer);

              const completeData = `data: ${JSON.stringify({
                status: 'complete',
                percent: 100,
                filename,
                filepath,
                downloadUrl: `/api/download/file?path=${encodeURIComponent(filepath)}&name=${encodeURIComponent(filename)}`,
              })}\n\n`;
              controller.enqueue(encoder.encode(completeData));
              controller.close();

              // Cleanup after 10 minutes
              setTimeout(async () => {
                try {
                  await unlink(filepath);
                } catch (e) {
                  console.error('Cleanup error:', e);
                }
              }, 600000);
            } catch (error: any) {
              const errorData = `data: ${JSON.stringify({
                status: 'error',
                message: 'Failed to save file: ' + error.message,
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          });

          audioStream.on('error', (error) => {
            console.error('Download error:', error);
            const errorData = `data: ${JSON.stringify({
              status: 'error',
              message: 'Download failed: ' + error.message,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          });
        }
      } catch (error: any) {
        console.error('Setup error:', error);
        const errorData = `data: ${JSON.stringify({
          status: 'error',
          message: error.message || 'Failed to process video. Please try another video.',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
