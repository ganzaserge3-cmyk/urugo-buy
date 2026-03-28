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

  const insertedCategories = await db.insert(categories).values(
    catalogCategorySeed.map((item) => ({
      ...item,
      nameTranslations: JSON.stringify({
        rw: item.slug === "fruits" ? "Imbuto" : item.slug === "foods" ? "Ibiribwa" : item.name,
      }),
    })),
  ).returning();
  const categoryBySlug = new Map(
    insertedCategories.map((category) => [category.slug, category.id]),
  );

  await db.insert(products).values(
    catalogProductSeed.map((item) => ({
      name: item.name,
      nameTranslations: JSON.stringify({ rw: item.name }),
      description: item.description,
      descriptionTranslations: JSON.stringify({ rw: item.description }),
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
      titleTranslations: JSON.stringify({ rw: "Ubuyobozi bwo guhitamo imbuto nshya" }),
      description: "How to choose and store fruits for maximum freshness.",
      descriptionTranslations: JSON.stringify({ rw: "Uko wahitamo kandi wabika imbuto kugira ngo zigume ari nshya." }),
      body: "Learn practical tips for selecting ripe fruits and storing them to keep quality high.",
      bodyTranslations: JSON.stringify({ rw: "Menya inama zagufasha guhitamo imbuto zeze no kuzibika neza kugira ngo zigume ku rwego rwiza." }),
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"Article\",\"headline\":\"Fresh Fruit Guide\"}",
      published: true,
    },
    {
      slug: "contact-us",
      title: "Contact Us",
      titleTranslations: JSON.stringify({ rw: "Tuvugishe" }),
      description: "Reach our team for orders, partnerships, customer support, and wholesale questions.",
      descriptionTranslations: JSON.stringify({ rw: "Vugana n'itsinda ryacu ku bijyanye na commandes, ubufatanye, support n'ibicuruzwa byinshi." }),
      body: "Need help with an order, delivery, or partnership? Email support@urugobuy.com or use the in-app support area from your account. For wholesale and international requests, include your country, product needs, and expected volumes so our team can respond faster.",
      bodyTranslations: JSON.stringify({ rw: "Ukeneye ubufasha kuri commande, delivery cyangwa ubufatanye? Andikira support@urugobuy.com cyangwa ukoreshe support iri muri konti yawe. Niba ushaka kugura byinshi cyangwa gutumiza mu kindi gihugu, shyiramo igihugu urimo, ibyo ukeneye n'ingano wifuza kugira ngo itsinda ryacu rigufashe vuba." }),
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"ContactPage\",\"name\":\"Contact Us\"}",
      published: true,
    },
    {
      slug: "faq",
      title: "Frequently Asked Questions",
      titleTranslations: JSON.stringify({ rw: "Ibibazo bikunze kubazwa" }),
      description: "Quick answers about delivery, payment, returns, and account support.",
      descriptionTranslations: JSON.stringify({ rw: "Ibisubizo byihuse ku kugemura, kwishyura, gusubiza ibicuruzwa na support ya konti." }),
      body: "Delivery times appear during checkout based on your market. Online payments can be resumed from the order page if a session expires. Returns can be requested from your account after delivery. If you need help fast, use the support ticket section in your account dashboard.",
      bodyTranslations: JSON.stringify({ rw: "Igihe cyo kugemura kigaragara muri checkout bitewe n'isoko wahisemo. Uburyo bwo kwishyura online bushobora kongera gutangizwa ku ipaji ya order niba session irangiye. Gusubiza ibicuruzwa bikorwa muri konti nyuma yo kubyakira. Niba ushaka ubufasha bwihuse, koresha support ticket iri muri dashboard ya konti yawe." }),
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"name\":\"FAQ\"}",
      published: true,
    },
    {
      slug: "shipping-delivery",
      title: "Shipping and Delivery",
      titleTranslations: JSON.stringify({ rw: "Kohereza no kugemura" }),
      description: "Learn how delivery slots, shipping fees, and order tracking work.",
      descriptionTranslations: JSON.stringify({ rw: "Menya uko delivery slots, amafaranga yo kohereza n'ikurikirana rya commandes bikora." }),
      body: "Shipping fees are shown before payment and may change by country or basket size. Customers can choose delivery slots where available, and every order gets a tracking-ready order page after checkout. For large or cross-border deliveries, our team may confirm timing separately after purchase.",
      bodyTranslations: JSON.stringify({ rw: "Amafaranga yo kohereza agaragazwa mbere yo kwishyura kandi ashobora guhinduka bitewe n'igihugu cyangwa ingano y'ibyo uguze. Aho bishoboka ushobora guhitamo igihe cya delivery, kandi buri commande igira urupapuro rwo kuyikurikirana nyuma ya checkout. Ku bintu byinshi cyangwa ibyo kohereza mu kindi gihugu, itsinda ryacu rishobora kubanza kwemeza igihe cyo kugemura nyuma yo kugura." }),
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"Shipping and Delivery\"}",
      published: true,
    },
    {
      slug: "international-shopping",
      title: "International Shopping",
      titleTranslations: JSON.stringify({ rw: "Kugura mpuzamahanga" }),
      description: "Information for customers buying across markets and currencies.",
      descriptionTranslations: JSON.stringify({ rw: "Amakuru ku bakiriya bagura mu masoko n'ifaranga bitandukanye." }),
      body: "UrugoBuy is being prepared for broader international use with localized language, currency, and content support. Market pricing, taxes, and delivery options may vary by country. If your region is not fully supported yet, contact us and we can help confirm availability, shipping approach, and custom order handling.",
      bodyTranslations: JSON.stringify({ rw: "UrugoBuy iri gutegurwa kugira ngo ikoreshwe n'abakiriya bo mu bihugu byinshi, harimo ururimi, ifaranga n'ibikubiye kuri site bihinduka bitewe n'isoko. Ibiciro, imisoro n'uburyo bwo kugemura bishobora gutandukana bitewe n'igihugu. Niba igihugu cyawe kitarashyigikirwa neza, twandikire tugufashe kumenya ibiboneka, uburyo bwo kohereza n'uko wafata commande yihariye." }),
      seoJsonLd: "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"International Shopping\"}",
      published: true,
    },
  ]);

  await db.insert(blogPosts).values([
    {
      slug: "weekly-market-update",
      title: "Weekly Market Update",
      titleTranslations: JSON.stringify({ rw: "Amakuru mashya y'isoko ya buri cyumweru" }),
      excerpt: "New arrivals, seasonal picks, and best deals this week.",
      excerptTranslations: JSON.stringify({ rw: "Ibishya byagezeho, ibihembwe byiza n'ibiciro byiza by'iki cyumweru." }),
      body: "This week we added fresh berries and premium avocados with improved delivery windows.",
      bodyTranslations: JSON.stringify({ rw: "Iki cyumweru twongeyemo berries nshya na avoka nziza kurushaho kandi tunoza amasaha yo kugemura." }),
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
