import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '@/lib/utils/sanitize';

describe('sanitizeFilename', () => {
  it('should remove dangerous characters', () => {
    const result = sanitizeFilename('test<file>name:with*bad|chars?.txt');
    expect(result).toBe('testfilenamewithbadchars.txt');
  });

  it('should prevent path traversal', () => {
    const result = sanitizeFilename('../../../etc/passwd');
    expect(result).toBe('etcpasswd');
  });

  it('should remove leading dots', () => {
    const result = sanitizeFilename('...hidden.txt');
    expect(result).toBe('hidden.txt');
  });

  it('should limit length to 200 chars', () => {
    const longName = 'a'.repeat(250) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result).toMatch(/\.txt$/);
  });

  it('should return default for empty input', () => {
    const result = sanitizeFilename('');
    expect(result).toBe('download');
  });

  it('should handle whitespace', () => {
    const result = sanitizeFilename('  spaced  file.txt  ');
    expect(result).toBe('spaced  file.txt');
  });
});