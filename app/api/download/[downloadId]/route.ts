import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { downloadManagerService } from '@/lib/services/download-manager.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string }> }
) {
  try {
    const { downloadId } = await params;
    const progress = downloadManagerService.getProgress(downloadId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Download not found' },
        { status: 404 }
      );
    }

    if (progress.status === 'completed' && progress.filePath) {
      const fileBuffer = await readFile(progress.filePath);
      const filename = progress.filePath.split('_').slice(1).join('_');

      await unlink(progress.filePath).catch(err => 
        logger.error({ err, filePath: progress.filePath }, 'Failed to delete file')
      );

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': progress.fileSize?.toString() || '0'
        }
      });
    }

    return NextResponse.json({
      status: progress.status,
      progress: progress.progress,
      error: progress.error
    });
  } catch (error) {
    logger.error({ error }, 'Download serving error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;