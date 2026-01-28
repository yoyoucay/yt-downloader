export function sanitizeFilename(filename: string): string {
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '')
    .trim();

  if (sanitized.length > 200) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    sanitized = sanitized.slice(0, 200 - ext.length) + ext;
  }

  return sanitized || 'download';
}