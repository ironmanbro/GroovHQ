// Unsplash placeholders are resized by Unsplash's own CDN; local/R2 images are served as-is.
export default function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('https://images.unsplash.com/')) return `${src.split('?')[0]}?w=${width}&q=${quality || 70}&auto=format&fit=crop`;
  return src;
}
