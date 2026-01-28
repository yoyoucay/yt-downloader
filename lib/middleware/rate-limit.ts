import { NextRequest } from 'next/server';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../config';
import { logger } from '../logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;

  constructor() {
    this.requests = new Map();
  }

  checkRateLimit(request: NextRequest): boolean {
    const ip = this.getClientIP(request);
    const now = Date.now();
    const entry = this.requests.get(ip);

    if (!entry || now > entry.resetTime) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      logger.warn({ ip, count: entry.count }, 'Rate limit exceeded');
      return false;
    }

    entry.count++;
    return true;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }

    return 'unknown';
  }
}

export const rateLimiter = new RateLimiter();