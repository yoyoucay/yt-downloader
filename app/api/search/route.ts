import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/lib/services/search.service';
import { SearchRequestSchema } from '@/lib/validation';
import { rateLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';

const searchService = new SearchService();

export async function GET(request: NextRequest) {
  try {
    if (!rateLimiter.checkRateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    const validation = SearchRequestSchema.safeParse({ query });

    if (!validation.success) {
      logger.warn({ errors: validation.error.errors }, 'Invalid search request');
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { query: validatedQuery } = validation.data;
    const videos = await searchService.searchVideos(validatedQuery);

    logger.info({ query: validatedQuery, resultCount: videos.length }, 'Search completed');

    return NextResponse.json({ videos });
  } catch (error) {
    logger.error({ error }, 'Search endpoint error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}