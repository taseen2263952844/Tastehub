// Lightweight strict SVG sanitizer stripping scripts, event handlers, and foreign objects
export default {
  sanitizeSvg(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed.toLowerCase().includes('<svg')) return '';
    return trimmed
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');
  },
};
