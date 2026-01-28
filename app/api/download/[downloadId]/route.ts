import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { downloadManagerService } from '@/lib/services/download-manager.service';
import { logger } from '@/lib/logger';
import path from 'path';

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
      try {
        const fileBuffer = await readFile(progress.filePath);
        const originalFilename = path.basename(progress.filePath);
        const filenameParts = originalFilename.substring(originalFilename.indexOf('_') + 1);
        
        const ext = path.extname(filenameParts);
        const nameWithoutExt = path.basename(filenameParts, ext);
        
        const sanitizedName = nameWithoutExt
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[<>:"/\\|?*]/g, '_')
          .trim() || 'download';
        
        const finalFilename = sanitizedName + ext;

        await unlink(progress.filePath).catch(err => 
          logger.error({ err, filePath: progress.filePath }, 'Failed to delete file')
        );

        const contentType = ext === '.mp3' ? 'audio/mpeg' : 'video/mp4';

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${finalFilename}"`,
            'Content-Length': progress.fileSize?.toString() || '0'
          }
        });
      } catch (fileError) {
        logger.error({ fileError, filePath: progress.filePath }, 'Failed to read file');
        return NextResponse.json(
          { error: 'Failed to read downloaded file' },
          { status: 500 }
        );
      }
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