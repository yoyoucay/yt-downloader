import { NextRequest, NextResponse } from 'next/server';
import { downloadManagerService } from '@/lib/services/download-manager.service';
import { DownloadRequestSchema } from '@/lib/validation';
import { rateLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimiter.checkRateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = DownloadRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.errors }, 'Invalid download request');
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { videoId, format, quality } = validation.data;
    const { downloadId } = await downloadManagerService.startDownload(videoId, format, quality);

    logger.info({ downloadId, videoId, format, quality }, 'Download initiated');

    return NextResponse.json({
      downloadId,
      status: 'processing'
    });
  } catch (error) {
    logger.error({ error }, 'Download initiation error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;

