import type { Category, Product } from "@shared/schema";
import { catalogCategorySeed, catalogProductSeed } from "@shared/catalog-seed";

const fallbackCategories: Category[] = catalogCategorySeed.map((category, index) => ({
  id: index + 1,
  name: category.name,
  slug: category.slug,
  imageUrl: category.imageUrl,
}));

const categoryIdBySlug = new Map(fallbackCategories.map((category) => [category.slug, category.id]));

const fallbackProducts: Product[] = catalogProductSeed.map((product, index) => ({
  id: index + 1,
  name: product.name,
  description: product.description,
  price: product.price,
  imageUrl: product.imageUrl,
  imageGallery: product.imageGallery,
  categoryId: categoryIdBySlug.get(product.category) ?? null,
  vendorId: null,
  rating: product.rating,
  isFeatured: product.featured,
  stockQuantity: product.stock,
}));

type ProductFilters = {
  categoryId?: number;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";
  search?: string;
};

export function getFallbackCategories() {
  return fallbackCategories;
}

export function getFallbackProducts(filters?: ProductFilters) {
  let rows = [...fallbackProducts];

  if (filters?.categoryId !== undefined) {
    rows = rows.filter((product) => product.categoryId === filters.categoryId);
  }
  if (filters?.featured !== undefined) {
    rows = rows.filter((product) => Boolean(product.isFeatured) === filters.featured);
  }
  if (filters?.inStock) {
    rows = rows.filter((product) => product.stockQuantity > 0);
  }
  if (filters?.minPrice !== undefined) {
    rows = rows.filter((product) => Number(product.price) >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    rows = rows.filter((product) => Number(product.price) <= filters.maxPrice!);
  }
  if (filters?.search?.trim()) {
    const query = filters.search.trim().toLowerCase();
    rows = rows.filter((product) =>
      product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query),
    );
  }

  switch (filters?.sort) {
    case "price-asc":
      rows.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price-desc":
      rows.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "rating-desc":
      rows.sort((a, b) => Number(b.rating) - Number(a.rating));
      break;
    case "name-asc":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
    default:
      rows.sort((a, b) => b.id - a.id);
      break;
  }

  return rows;
}

export function getFallbackProduct(productId: number) {
  return fallbackProducts.find((product) => product.id === productId) ?? null;
}

export function getFallbackSearchSuggestions(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return fallbackProducts
    .filter((product) => product.name.toLowerCase().includes(normalized))
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
    }));
}
