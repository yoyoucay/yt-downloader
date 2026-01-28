import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filepath = searchParams.get('path');
    const customFilename = searchParams.get('name');

    if (!filepath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    const filename = customFilename || path.basename(filepath);

    // Delete file after a short delay
    setTimeout(async () => {
      try {
        await unlink(filepath);
        console.log('File deleted:', filepath);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }, 2000);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
