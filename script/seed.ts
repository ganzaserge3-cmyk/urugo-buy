import { db } from "../server/db";
import { catalogCategorySeed, catalogProductSeed } from "../shared/catalog-seed";

import {
  accountPreferences,
  blogPosts,
  categories,
  contentPages,
  currencyRates,
  coupons,
  notificationLogs,
  notificationSubscriptions,
  orderItems,
  orderMeta,
  orders,
  productQuestions,
  productReviews,
  promotions,
  products,
  returnStatusEvents,
  returnRequests,
  riskAssessments,
  subscriptions,
  supportTickets,
  twoFactorChallenges,
  vendors,
  wishlistShares,
  wishlists,
} from "../shared/schema";

async function seed() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) {
    await db.delete(notificationLogs);
    await db.delete(orderMeta);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(productReviews);
    await db.delete(wishlists);
    await db.delete(wishlistShares);
    await db.delete(accountPreferences);
    await db.delete(twoFactorChallenges);
    await db.delete(supportTickets);
    await db.delete(returnStatusEvents);
    await db.delete(returnRequests);
    await db.delete(productQuestions);
    await db.delete(promotions);
    await db.delete(subscriptions);
    await db.delete(notificationSubscriptions);
    await db.delete(riskAssessments);
    await db.delete(contentPages);
    await db.delete(blogPosts);
    await db.delete(currencyRates);
    await db.delete(vendors);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(coupons);
    console.log("Existing catalog data cleared.");
  }

  const insertedCategories = await db.insert(categories).values([...catalogCategorySeed]).returning();
  const categoryBySlug = new Map(
    insertedCategories.map((category) => [category.slug, category.id]),
  );

  await db.insert(products).values(
    catalogProductSeed.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      imageGallery: item.imageGallery,
      categoryId: categoryBySlug.get(item.category),
      rating: item.rating,
      isFeatured: item.featured,
      stockQuantity: item.stock,
    })),
  );

  await db.insert(coupons).values([
    { code: "FRESH10", discountType: "percent", value: "10.00", minSpend: "30.00", active: true },
    { code: "WELCOME5", discountType: "fixed", value: "5.00", minSpend: "20.00", active: true },
  ]);

  await db.insert(vendors).values([
    { name: "Urugo Farms", slug: "urugo-farms", contactEmail: "vendors@urugobuy.com", active: true },
  ]);

  await db.insert(currencyRates).values([
    { code: "USD", rateFromUsd: "1.000000", symbol: "$" },
    { code: "EUR", rateFromUsd: "0.930000", symbol: "€" },
    { code: "GBP", rateFromUsd: "0.790000", symbol: "£" },
  ]);

  await db.insert(contentPages).values([
    {
      slug: "fresh-fruit-guide",
      title: "Fresh Fruit Guide",
      description: "How to choose and store fruits for maximum freshness.",
      body: "Learn practical tips for selecting ripe fruits and storing them to keep quality high.",
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"Article\",\"headline\":\"Fresh Fruit Guide\"}",
      published: true,
    },
  ]);

  await db.insert(blogPosts).values([
    {
      slug: "weekly-market-update",
      title: "Weekly Market Update",
      excerpt: "New arrivals, seasonal picks, and best deals this week.",
      body: "This week we added fresh berries and premium avocados with improved delivery windows.",
      coverImageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1200&auto=format&fit=crop",
      published: true,
    },
  ]);

  console.log(
    `Seed completed: ${insertedCategories.length} categories and ${catalogProductSeed.length} products.`,
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
