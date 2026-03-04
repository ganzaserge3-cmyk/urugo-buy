const DEFAULT_PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587393855524-087f83d95ac7?q=80&w=1200&auto=format&fit=crop",
];

function pickDefaultProductImage(seed: number): string {
  const index = Math.abs(seed) % DEFAULT_PRODUCT_IMAGES.length;
  return DEFAULT_PRODUCT_IMAGES[index];
}

export function normalizeProductImageUrl(rawUrl: string | null | undefined, seed = 0): string {
  if (!rawUrl || !rawUrl.trim()) return pickDefaultProductImage(seed);
  const value = rawUrl.trim();

  if (value.startsWith("/")) return value;
  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    return pickDefaultProductImage(seed);
  }
  if (value.startsWith("http://")) {
    return `https://${value.slice("http://".length)}`;
  }
  if (value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;

  return pickDefaultProductImage(seed);
}

export function buildProductImageGallery(args: {
  imageUrl?: string | null;
  imageGallery?: string[] | null;
  productId?: number;
}): string[] {
  const seed = args.productId ?? 0;
  const gallery = Array.isArray(args.imageGallery) ? args.imageGallery : [];
  const normalizedGallery = gallery
    .map((url, i) => normalizeProductImageUrl(url, seed + i))
    .filter((url, index, arr) => arr.indexOf(url) === index);

  if (normalizedGallery.length > 0) return normalizedGallery;
  return [normalizeProductImageUrl(args.imageUrl, seed)];
}
