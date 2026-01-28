import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink, access } from 'fs/promises';
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

    logger.info({ downloadId, progress }, 'Download request received');

    if (!progress) {
      return NextResponse.json(
        { error: 'Download not found' },
        { status: 404 }
      );
    }

    if (progress.status === 'completed' && progress.filePath) {
      try {
        logger.info({ filePath: progress.filePath }, 'Attempting to read file');
        
        await access(progress.filePath);
        logger.info({ filePath: progress.filePath }, 'File exists, reading...');
        
        const fileBuffer = await readFile(progress.filePath);
        logger.info({ fileSize: fileBuffer.length }, 'File read successfully');
        
        const originalFilename = path.basename(progress.filePath);
        const filenameParts = originalFilename.substring(originalFilename.indexOf('_') + 1);
        
        const ext = path.extname(filenameParts);
        const nameWithoutExt = path.basename(filenameParts, ext);
        
        const sanitizedName = nameWithoutExt
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[<>:"/\\|?*]/g, '_')
          .trim() || 'download';
        
        const finalFilename = sanitizedName + ext;
        
        logger.info({ originalFilename, finalFilename }, 'Filename sanitized');

        const contentType = ext === '.mp3' ? 'audio/mpeg' : 'video/mp4';

        const response = new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${finalFilename}"`,
            'Content-Length': fileBuffer.length.toString()
          }
        });

        logger.info({ finalFilename, size: fileBuffer.length }, 'Sending file to client');

        await unlink(progress.filePath).catch(err => 
          logger.error({ err, filePath: progress.filePath }, 'Failed to delete file')
        );

        return response;
      } catch (fileError) {
        logger.error({ 
          fileError, 
          filePath: progress.filePath,
          errorMessage: fileError instanceof Error ? fileError.message : 'Unknown error',
          errorStack: fileError instanceof Error ? fileError.stack : undefined
        }, 'Failed to read file');
        return NextResponse.json(
          { error: 'Failed to read downloaded file', details: fileError instanceof Error ? fileError.message : 'Unknown error' },
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
    logger.error({ 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    }, 'Download serving error');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300;