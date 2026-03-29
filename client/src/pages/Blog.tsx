import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useSeo } from "@/hooks/use-seo";
import { getStoredLanguageCode, useI18n } from "@/lib/i18n";

const fallbackPosts = [
  {
    id: 1,
    slug: "how-to-buy-fruits-online-safely",
    title: "How to Buy Fruits Online Safely",
    excerpt: "A practical guide to checking freshness signals, photos, descriptions, and store credibility before placing an order.",
  },
  {
    id: 2,
    slug: "weekly-grocery-planning-for-busy-households",
    title: "Weekly Grocery Planning for Busy Households",
    excerpt: "Plan fruit, pantry, and meal-prep shopping in a way that reduces waste and saves time during the week.",
  },
  {
    id: 3,
    slug: "what-makes-a-trustworthy-online-food-store",
    title: "What Makes a Trustworthy Online Food Store",
    excerpt: "We break down the signs of a reliable ecommerce grocery website, from legal pages to product detail quality.",
  },
] as const;

export default function Blog() {
  const { t, market } = useI18n();
  useSeo(t("blog.metaTitle"), t("blog.metaDescription"), {
    canonicalPath: "/blog",
    keywords: ["grocery blog", "fruit buying guides", "online food shopping tips", "UrugoBuy blog"],
    type: "website",
  });
  const [posts, setPosts] = useState<Array<{ id: number; slug: string; title: string; excerpt: string }>>([]);

  useEffect(() => {
    fetch(`/api/blog/posts?lang=${encodeURIComponent(getStoredLanguageCode())}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setPosts(Array.isArray(rows) && rows.length > 0 ? rows : [...fallbackPosts]))
      .catch(() => setPosts([...fallbackPosts]));
  }, [market.language]);

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-3 font-display text-4xl font-bold">{t("blog.title")}</h1>
        <p className="mb-8 text-muted-foreground">{t("blog.subtitle")}</p>

        <div className="mb-10 rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="mb-3 font-display text-2xl font-semibold">Editorial Focus</h2>
          <p className="leading-relaxed text-muted-foreground">
            Our articles are built to help visitors make better shopping decisions online. We focus on trust, food
            quality, product evaluation, and practical guidance that makes the website more useful than a thin catalog.
          </p>
        </div>

        <div className="space-y-4">
          {posts.length === 0 && <p className="text-muted-foreground">{t("blog.empty")}</p>}
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-xl border border-border p-5 transition hover:bg-muted/20">
              <h2 className="font-display text-2xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
