const DEFAULT_FRUIT_IMAGES = [
  "/product-fallbacks/pexels-karola-g-4230621.jpg",
  "/product-fallbacks/pexels-mudrik-h-amin-1252431-2485430.jpg",
  "/product-fallbacks/pexels-pixabay-266346.jpg",
  "/product-fallbacks/pexels-pixabay-115019.jpg",
  "/product-fallbacks/charlesdeluvio-0v_1TPz1uXw-unsplash.jpg",
];

const DEFAULT_FOOD_IMAGES = [
  "/product-fallbacks/zaib-tse-KVv5lFOMY1E-unsplash.jpg",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop",
];

const DEFAULT_GENERIC_IMAGES = [
  ...DEFAULT_FRUIT_IMAGES,
  ...DEFAULT_FOOD_IMAGES,
];

const LOCAL_FALLBACK_FILENAMES = new Set(
  [...DEFAULT_GENERIC_IMAGES]
    .filter((url) => url.startsWith("/product-fallbacks/"))
    .map((url) => url.replace("/product-fallbacks/", "")),
);

const FRUIT_KEYWORDS = [
  "fruit",
  "banana",
  "orange",
  "lemon",
  "lime",
  "mango",
  "apple",
  "pear",
  "grape",
  "kiwi",
  "berry",
  "strawberry",
  "blueberry",
  "avocado",
  "pineapple",
  "watermelon",
  "citrus",
  "plum",
  "pomegranate",
];

const FOOD_KEYWORDS = [
  "food",
  "vegetable",
  "chicken",
  "fish",
  "salmon",
  "bread",
  "rice",
  "oil",
  "cheese",
  "egg",
  "eggs",
  "pasta",
  "sauce",
  "yogurt",
  "milk",
  "oat",
  "honey",
  "meat",
];

export interface ProductImageContext {
  categoryId?: number | null;
  name?: string | null;
  description?: string | null;
}

function resolveLocalFallbackPath(value: string): string | null {
  const cleaned = value.trim().replace(/\\/g, "/");
  const filename = cleaned.split("/").pop();
  if (!filename) return null;
  if (!LOCAL_FALLBACK_FILENAMES.has(filename)) return null;
  return `/product-fallbacks/${filename}`;
}

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return false;

  const first = Number(match[1]);
  const second = Number(match[2]);

  if (first === 10) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  return false;
}

function pickBySeed(seed: number, images: string[]): string {
  const index = Math.abs(seed) % images.length;
  return images[index];
}

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectImageBucket(context?: ProductImageContext): "fruits" | "foods" | "generic" {
  if (!context) return "generic";

  if (context.categoryId === 1) return "fruits";
  if (context.categoryId === 2) return "foods";

  const source = `${context.name || ""} ${context.description || ""}`.toLowerCase();
  if (!source.trim()) return "generic";

  if (includesKeyword(source, FRUIT_KEYWORDS)) return "fruits";
  if (includesKeyword(source, FOOD_KEYWORDS)) return "foods";
  return "generic";
}

export function pickDefaultProductImage(seed: number, context?: ProductImageContext): string {
  const bucket = detectImageBucket(context);
  if (bucket === "fruits") return pickBySeed(seed, DEFAULT_FRUIT_IMAGES);
  if (bucket === "foods") return pickBySeed(seed, DEFAULT_FOOD_IMAGES);
  return pickBySeed(seed, DEFAULT_GENERIC_IMAGES);
}

export function normalizeProductImageUrl(
  rawUrl: string | null | undefined,
  seed = 0,
  context?: ProductImageContext,
): string {
  if (!rawUrl || !rawUrl.trim()) return pickDefaultProductImage(seed, context);
  const value = rawUrl.trim();
  const localFallbackPath = resolveLocalFallbackPath(value);
  if (localFallbackPath) return localFallbackPath;

  if (value.startsWith("/")) return value;
  if (value.startsWith("uploads/") || value.startsWith("images/")) return `/${value}`;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return pickDefaultProductImage(seed, context);
      }

      const isLocalLanHost =
        isPrivateIpv4(hostname) ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local");

      // Keep local/LAN URLs unchanged so mobile devices can load images in dev setups.
      if (isLocalLanHost) return value;

      if (url.protocol === "http:") {
        url.protocol = "https:";
        return url.toString();
      }
      return value;
    } catch {
      return pickDefaultProductImage(seed, context);
    }
  }
  if (value.startsWith("www.")) return `https://${value}`;

  return pickDefaultProductImage(seed, context);
}

export function buildProductImageGallery(args: {
  imageUrl?: string | null;
  imageGallery?: string[] | null;
  productId?: number;
  context?: ProductImageContext;
}): string[] {
  const seed = args.productId ?? 0;
  const primaryImage = normalizeProductImageUrl(args.imageUrl, seed, args.context);
  const gallery = Array.isArray(args.imageGallery) ? args.imageGallery : [];
  const normalizedGallery = [primaryImage, ...gallery.map((url, i) => normalizeProductImageUrl(url, seed + i + 1, args.context))]
    .filter((url, index, arr) => arr.indexOf(url) === index);

  const fallbackGallery = [
    primaryImage,
    pickDefaultProductImage(seed + 101, args.context),
    pickDefaultProductImage(seed + 202, args.context),
    pickDefaultProductImage(seed + 303, args.context),
  ].filter((url, index, arr) => arr.indexOf(url) === index);

  const merged = [...normalizedGallery];
  for (const fallback of fallbackGallery) {
    if (merged.length >= 4) break;
    if (!merged.includes(fallback)) merged.push(fallback);
  }

  return merged.slice(0, 4);
}
