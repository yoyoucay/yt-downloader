export function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let ext = '';

  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    ext = filename.substring(lastDotIndex);
  }

  let sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim();

  const maxLength = 200;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return (sanitized || 'download') + ext;
}