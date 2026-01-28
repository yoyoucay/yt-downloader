import { NextRequest } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

const agent = ytdl.createAgent(undefined, {
  localAddress: undefined,
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { videoId, format, quality } = await request.json();

  if (!videoId || !format) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const cacheDir = path.join(os.tmpdir(), 'ytdl-cache');
  
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }

  const originalCwd = process.cwd();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        process.chdir(cacheDir);

        const initialData = `data: ${JSON.stringify({
          status: 'starting',
          message: 'Fetching video information...',
          percent: 0,
        })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        if (!ytdl.validateURL(videoUrl)) {
          throw new Error('Invalid YouTube URL');
        }

        const info = await ytdl.getInfo(videoUrl, { agent });
        const title = sanitizeFilename(info.videoDetails.title);

        const prepareData = `data: ${JSON.stringify({
          status: 'preparing',
          message: 'Preparing download...',
          percent: 5,
        })}\n\n`;
        controller.enqueue(encoder.encode(prepareData));

        if (format === 'mp4') {
          const videoStream = ytdl(videoUrl, {
            quality: 'highestvideo',
            filter: (fmt) => fmt.hasVideo && fmt.hasAudio,
            agent,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            },
          });

          videoStream.on('progress', (_chunkLength: number, downloaded: number, total: number) => {
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
          
          videoStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          videoStream.on('end', async () => {
            try {
              process.chdir(originalCwd);
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

              setTimeout(async () => {
                try {
                  await unlink(filepath);
                } catch (e) {
                  console.error('Cleanup error:', e);
                }
              }, 600000);
            } catch (error) {
              process.chdir(originalCwd);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              const errorData = `data: ${JSON.stringify({
                status: 'error',
                message: 'Failed to save file: ' + errorMessage,
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          });

          videoStream.on('error', (error: Error) => {
            process.chdir(originalCwd);
            console.error('Download error:', error);
            const errorData = `data: ${JSON.stringify({
              status: 'error',
              message: 'Download failed: ' + error.message + '. This video may be restricted or age-gated.',
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          });

        } else {
          const formats = ytdl.filterFormats(info.formats, 'audioonly');
          
          if (formats.length === 0) {
            throw new Error('No audio formats available for this video');
          }

          const audioFormat = formats.reduce((best, current) => {
            const bestBitrate = parseInt(best.audioBitrate?.toString() || '0');
            const currentBitrate = parseInt(current.audioBitrate?.toString() || '0');
            return currentBitrate > bestBitrate ? current : best;
          });

          console.log('Selected audio format:', audioFormat.itag, 'bitrate:', audioFormat.audioBitrate);

          const audioStream = ytdl(videoUrl, {
            format: audioFormat,
            agent,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            },
          });

          audioStream.on('progress', (_chunkLength: number, downloaded: number, total: number) => {
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
          
          audioStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          audioStream.on('end', async () => {
            try {
              process.chdir(originalCwd);
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

              setTimeout(async () => {
                try {
                  await unlink(filepath);
                } catch (e) {
                  console.error('Cleanup error:', e);
                }
              }, 600000);
            } catch (error) {
              process.chdir(originalCwd);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              const errorData = `data: ${JSON.stringify({
                status: 'error',
                message: 'Failed to save file: ' + errorMessage,
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          });

          audioStream.on('error', (error: Error) => {
            process.chdir(originalCwd);
            console.error('Download error:', error);
            const errorData = `data: ${JSON.stringify({
              status: 'error',
              message: 'Download failed: ' + error.message + '. This video may be restricted or require authentication.',
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          });
        }
      } catch (error) {
        process.chdir(originalCwd);
        console.error('Setup error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
        
        let userMessage = errorMessage;
        if (errorMessage.includes('403')) {
          userMessage = 'YouTube blocked the request (403). This video may be age-restricted or require sign-in. Please try a different video.';
        } else if (errorMessage.includes('410')) {
          userMessage = 'This video is no longer available (410).';
        } else if (errorMessage.includes('404')) {
          userMessage = 'Video not found (404). Please check the URL.';
        }
        
        const errorData = `data: ${JSON.stringify({
          status: 'error',
          message: userMessage,
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

