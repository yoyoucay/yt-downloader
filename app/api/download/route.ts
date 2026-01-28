import { NextRequest } from 'next/server';
import ytdl from '@distube/ytdl-core';

const agent = ytdl.createAgent(undefined, {
  localAddress: undefined,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    const format = searchParams.get('format');

    if (!videoId || !format) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    if (!ytdl.validateURL(videoUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const info = await ytdl.getInfo(videoUrl, { agent });
    const title = info.videoDetails.title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200);

    let stream;
    let contentType;
    let filename;

    if (format === 'mp4') {
      stream = ytdl(videoUrl, {
        quality: 'highestvideo',
        filter: (fmt) => fmt.hasVideo && fmt.hasAudio,
        agent,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      });
      contentType = 'video/mp4';
      filename = `${title}.mp4`;
    } else {
      const formats = ytdl.filterFormats(info.formats, 'audioonly');
      
      if (formats.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No audio formats available' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const audioFormat = formats.reduce((best, current) => {
        const bestBitrate = parseInt(best.audioBitrate?.toString() || '0');
        const currentBitrate = parseInt(current.audioBitrate?.toString() || '0');
        return currentBitrate > bestBitrate ? current : best;
      });

      stream = ytdl(videoUrl, {
        format: audioFormat,
        agent,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      });
      contentType = 'audio/mpeg';
      filename = `${title}.mp3`;
    }

    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });

        stream.on('end', () => {
          controller.close();
        });

        stream.on('error', (error: Error) => {
          console.error('Stream error:', error);
          controller.error(error);
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'X-Filename': encodeURIComponent(filename),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to download';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;

