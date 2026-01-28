export function sanitizeFilename(filename: string): string {
  // Extract extension first
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let ext = '';

  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    ext = filename.substring(lastDotIndex);
  }

  // Sanitize the name: keep only ASCII printable characters (32-126)
  let sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '')
    .replace(/\s+/g, '_')
    .trim();

  // Limit length
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Append extension back
  return (sanitized || 'download') + ext;
}