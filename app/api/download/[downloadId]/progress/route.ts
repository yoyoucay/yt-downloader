import { NextRequest, NextResponse } from 'next/server';
import { downloadManagerService } from '@/lib/services/download-manager.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string }> }
) {
  try {
    const { downloadId } = await params;
    logger.info({ downloadId, path: request.url }, 'Progress endpoint called');

    const progress = downloadManagerService.getProgress(downloadId);

    if (!progress) {
      logger.warn({ downloadId }, 'Download not found in map');
      return NextResponse.json(
        { error: 'Download not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    logger.error({ error }, 'Progress check error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';