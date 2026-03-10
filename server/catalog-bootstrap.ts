import { db } from "./db";
import { categories, products } from "@shared/schema";
import { catalogCategorySeed, catalogProductSeed } from "@shared/catalog-seed";

export async function ensureCatalogSeeded() {
  const existingCategories = await db.select().from(categories);
  const existingProducts = await db.select().from(products);

  if (existingCategories.length > 0 && existingProducts.length > 0) {
    return;
  }

  const categoryBySlug = new Map(existingCategories.map((category) => [category.slug, category.id]));

  if (existingCategories.length === 0) {
    const insertedCategories = await db.insert(categories).values([...catalogCategorySeed]).returning();
    for (const category of insertedCategories) {
      categoryBySlug.set(category.slug, category.id);
    }
  }

  if (existingProducts.length === 0) {
    await db.insert(products).values(
      catalogProductSeed.map((item) => ({
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        imageGallery: item.imageGallery,
        categoryId: categoryBySlug.get(item.category) ?? null,
        rating: item.rating,
        isFeatured: item.featured,
        stockQuantity: item.stock,
      })),
    );
  }
}
