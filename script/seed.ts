import { db } from "../server/db";

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

const categorySeed = [
  {
    name: "Fruits",
    slug: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Foods",
    slug: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
  },
];

const productSeed = [
  {
    name: "Fresh Mango Box",
    price: "14.00",
    rating: "4.8",
    featured: true,
    stock: 35,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1200&auto=format&fit=crop",
    description:
      "Sweet ripe mangoes packed fresh for smoothies, desserts, and daily snacking.",
  },
  {
    name: "Strawberry Fresh Pack",
    price: "7.60",
    rating: "4.8",
    featured: true,
    stock: 38,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1587393855524-087f83d95ac7?q=80&w=1200&auto=format&fit=crop",
    description:
      "Hand-picked strawberries with bright flavor, perfect for desserts and breakfast.",
  },
  {
    name: "Orange Citrus Bag",
    price: "8.20",
    rating: "4.6",
    featured: false,
    stock: 45,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=1200&auto=format&fit=crop",
    description:
      "Fresh citrus oranges rich in vitamin C, ideal for juice and healthy snacks.",
  },
  {
    name: "Pineapple Tropic Cut",
    price: "6.90",
    rating: "4.5",
    featured: false,
    stock: 26,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?q=80&w=1200&auto=format&fit=crop",
    description:
      "Sweet pineapple portions cleaned and ready to serve for quick convenience.",
  },
  {
    name: "Premium Apple Mix",
    price: "9.50",
    rating: "4.7",
    featured: true,
    stock: 50,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1200&auto=format&fit=crop",
    description:
      "Crisp red and green apples selected for balanced sweetness and crunch.",
  },
  {
    name: "Blueberry Cup",
    price: "5.90",
    rating: "4.7",
    featured: true,
    stock: 32,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=1200&auto=format&fit=crop",
    description:
      "Premium blueberries loaded with antioxidants for healthy snacks and smoothies.",
  },
  {
    name: "Watermelon Slice Box",
    price: "10.40",
    rating: "4.4",
    featured: false,
    stock: 18,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1563114773-84221bd62daa?q=80&w=1200&auto=format&fit=crop",
    description:
      "Chilled watermelon pieces packed for freshness and instant summer refreshment.",
  },
  {
    name: "Kiwi Green Pack",
    price: "6.10",
    rating: "4.5",
    featured: false,
    stock: 34,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1610917047732-8ac31f1f7f84?q=80&w=1200&auto=format&fit=crop",
    description:
      "Fresh kiwi with bright tangy flavor, great for fruit bowls and yogurt.",
  },
  {
    name: "Seedless Grapes Pack",
    price: "6.75",
    rating: "4.6",
    featured: false,
    stock: 42,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?q=80&w=1200&auto=format&fit=crop",
    description:
      "Juicy seedless grapes, washed and packed for quick, healthy snacking.",
  },
  {
    name: "Banana Family Bundle",
    price: "5.20",
    rating: "4.5",
    featured: false,
    stock: 60,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1603833665858-e61d17a86224?q=80&w=1200&auto=format&fit=crop",
    description:
      "Naturally sweet bananas rich in potassium, ideal for kids and breakfast bowls.",
  },
  {
    name: "Pear Sweet Basket",
    price: "8.80",
    rating: "4.5",
    featured: false,
    stock: 27,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=1200&auto=format&fit=crop",
    description:
      "Soft and juicy pears with natural sweetness for snacks and baking recipes.",
  },
  {
    name: "Avocado Cream Pack",
    price: "11.20",
    rating: "4.7",
    featured: true,
    stock: 24,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?q=80&w=1200&auto=format&fit=crop",
    description:
      "Ripe avocados selected for creamy texture and healthy fats in daily meals.",
  },
  {
    name: "Mixed Fruit Family Crate",
    price: "24.00",
    rating: "4.9",
    featured: true,
    stock: 12,
    category: "fruits",
    imageUrl:
      "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1200&auto=format&fit=crop",
    description:
      "Family-size crate with mixed premium fruits for the whole week.",
  },
  {
    name: "Organic Vegetable Basket",
    price: "18.00",
    rating: "4.8",
    featured: true,
    stock: 28,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=1200&auto=format&fit=crop",
    description:
      "Seasonal vegetables including carrots, peppers, tomatoes, and leafy greens.",
  },
  {
    name: "Chicken Breast Fillet",
    price: "13.50",
    rating: "4.7",
    featured: true,
    stock: 30,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=1200&auto=format&fit=crop",
    description:
      "Lean chicken breast fillets, fresh and trimmed for healthy high-protein meals.",
  },
  {
    name: "Salmon Fillet Premium",
    price: "16.90",
    rating: "4.8",
    featured: true,
    stock: 20,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=1200&auto=format&fit=crop",
    description:
      "Fresh salmon fillets rich in omega-3, ideal for grilling and oven baking.",
  },
  {
    name: "Brown Rice 1kg",
    price: "4.30",
    rating: "4.6",
    featured: false,
    stock: 70,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1200&auto=format&fit=crop",
    description:
      "Whole-grain brown rice with a nutty flavor for balanced everyday meals.",
  },
  {
    name: "Whole Grain Bread Loaf",
    price: "3.80",
    rating: "4.4",
    featured: false,
    stock: 40,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1200&auto=format&fit=crop",
    description:
      "Soft whole grain bread baked daily, perfect for sandwiches and toast.",
  },
  {
    name: "Olive Oil Extra Virgin",
    price: "12.00",
    rating: "4.8",
    featured: false,
    stock: 40,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=1200&auto=format&fit=crop",
    description:
      "Cold-pressed extra virgin olive oil for cooking, salads, and marinades.",
  },
  {
    name: "Cheddar Cheese Block",
    price: "6.70",
    rating: "4.5",
    featured: false,
    stock: 33,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=1200&auto=format&fit=crop",
    description:
      "Aged cheddar block with rich taste for sandwiches, pasta, and snacks.",
  },
  {
    name: "Farm Eggs (12 pcs)",
    price: "4.90",
    rating: "4.7",
    featured: false,
    stock: 46,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1200&auto=format&fit=crop",
    description:
      "Fresh farm eggs with rich yolks for breakfast, baking, and healthy meals.",
  },
  {
    name: "Pasta Penne 500g",
    price: "2.90",
    rating: "4.4",
    featured: false,
    stock: 66,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=80&w=1200&auto=format&fit=crop",
    description:
      "Classic penne pasta for quick family dinners with your favorite sauces.",
  },
  {
    name: "Tomato Sauce Jar",
    price: "3.40",
    rating: "4.5",
    featured: false,
    stock: 58,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1604908177522-402d63463a0c?q=80&w=1200&auto=format&fit=crop",
    description:
      "Slow-cooked tomato sauce with natural herbs for pasta and home recipes.",
  },
  {
    name: "Natural Yogurt Cup",
    price: "2.40",
    rating: "4.5",
    featured: false,
    stock: 55,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200&auto=format&fit=crop",
    description:
      "Creamy plain yogurt with no artificial flavors, great with fruit and honey.",
  },
  {
    name: "Greek Yogurt Protein",
    price: "3.10",
    rating: "4.7",
    featured: false,
    stock: 44,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1571212515416-fca3f6f8f0a4?q=80&w=1200&auto=format&fit=crop",
    description:
      "High-protein Greek yogurt with thick texture for breakfast and fitness diets.",
  },
  {
    name: "Oatmeal Family Pack",
    price: "5.60",
    rating: "4.6",
    featured: false,
    stock: 52,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=1200&auto=format&fit=crop",
    description:
      "Whole oat flakes for warm breakfast bowls with fruits and nuts.",
  },
  {
    name: "Honey Pure Jar",
    price: "7.40",
    rating: "4.8",
    featured: false,
    stock: 36,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1587049352851-8d4e89133924?q=80&w=1200&auto=format&fit=crop",
    description:
      "Natural pure honey, smooth and aromatic for tea, toast, and desserts.",
  },
  {
    name: "Frozen Mixed Vegetables",
    price: "4.80",
    rating: "4.3",
    featured: false,
    stock: 49,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    description:
      "Quick-cook vegetable mix for stir-fry, soups, and healthy side dishes.",
  },
  {
    name: "Whole Milk 1L",
    price: "2.20",
    rating: "4.4",
    featured: false,
    stock: 0,
    category: "foods",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1200&auto=format&fit=crop",
    description:
      "Fresh whole milk with creamy taste for tea, coffee, and cereal.",
  },
];

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

  const insertedCategories = await db.insert(categories).values(categorySeed).returning();
  const categoryBySlug = new Map(
    insertedCategories.map((category) => [category.slug, category.id]),
  );

  await db.insert(products).values(
    productSeed.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
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
    `Seed completed: ${insertedCategories.length} categories and ${productSeed.length} products.`,
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
