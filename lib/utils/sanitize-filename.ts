/**
 * Sanitize filename for safe downloading in browser
 * Preserves original filename while removing invalid characters and emojis
 */
export function sanitizeFilename(filename: string, fallback: string = 'download'): string {
  if (!filename || typeof filename !== 'string') {
    return fallback;
  }

  let sanitized = filename.trim();

  // Remove emojis and special unicode symbols
  // Keep basic Latin characters, numbers, spaces, and common punctuation
  sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols and Pictographs
  sanitized = sanitized.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
  sanitized = sanitized.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
  sanitized = sanitized.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
  sanitized = sanitized.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
  sanitized = sanitized.replace(/[\u{FE00}-\u{FE0F}]/gu, '');   // Variation Selectors
  sanitized = sanitized.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
  sanitized = sanitized.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
  sanitized = sanitized.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A

  // Remove invalid filename characters for Windows/Mac/Linux
  // Invalid: < > : " / \ | ? * and control characters (0-31)
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');

  // Remove leading/trailing dots and spaces (Windows doesn't allow these)
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // Replace multiple consecutive spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Limit length (filesystem limit is 255, but we'll use 200 to be safe)
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    // Try to preserve file extension if it exists
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot > 0 && lastDot > maxLength - 10) {
      const ext = sanitized.substring(lastDot);
      sanitized = sanitized.substring(0, maxLength - ext.length) + ext;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  // If after all sanitization we end up with empty string, use fallback
  if (!sanitized || sanitized.length === 0) {
    return fallback;
  }

  return sanitized;
}

/**
 * Add file extension if not present
 */
export function ensureExtension(filename: string, format: 'mp3' | 'mp4'): string {
  const ext = `.${format}`;
  
  // Check if filename already has the correct extension (case-insensitive)
  if (filename.toLowerCase().endsWith(ext)) {
    return filename;
  }

  // Remove any existing extension that doesn't match
  const lastDot = filename.lastIndexOf('.');
  if (lastDot > 0) {
    const existingExt = filename.substring(lastDot).toLowerCase();
    // Only keep known video/audio extensions
    const knownExts = ['.mp3', '.mp4', '.m4a', '.webm', '.mkv', '.avi'];
    if (!knownExts.includes(existingExt)) {
      filename = filename.substring(0, lastDot);
    }
  }

  return filename + ext;
}