import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useSeo } from "@/hooks/use-seo";
import { getStoredLanguageCode, useI18n } from "@/lib/i18n";

const fallbackPosts: Record<string, { title: string; excerpt: string; body: string }> = {
  "how-to-buy-fruits-online-safely": {
    title: "How to Buy Fruits Online Safely",
    excerpt: "A practical guide to checking freshness signals, photos, descriptions, and store credibility before placing an order.",
    body: `Buying fruits online should feel trustworthy, not risky.

Start with the product page. A serious ecommerce store should show more than one product image when possible, describe what the buyer actually receives, and explain the difference between pack formats, sizes, or usage.

Next, read the product description carefully. Good descriptions explain the item clearly enough that a visitor can understand what they are buying without guessing. This matters for trust, conversions, and customer satisfaction.

Also check whether the website includes visible legal pages, business contact information, and support channels. Real stores usually make privacy, contact, and company information easy to find.

Finally, review delivery guidance and site quality before placing an order. A trustworthy platform gives visitors enough information to make an informed decision rather than pushing them into a blind purchase.`,
  },
  "weekly-grocery-planning-for-busy-households": {
    title: "Weekly Grocery Planning for Busy Households",
    excerpt: "Plan fruit, pantry, and meal-prep shopping in a way that reduces waste and saves time during the week.",
    body: `A good weekly grocery plan begins with predictable essentials.

Fresh fruit, breakfast staples, and cooking basics often form the core of an efficient shopping routine. When those items are clearly categorized and easy to compare online, the shopper saves time and reduces repeat decision fatigue.

Households can improve consistency by splitting the basket into short-life items and longer-lasting staples. Fresh berries and leafy greens may be used early in the week, while pantry goods and shelf-stable products support later meals.

Product detail matters here too. Multiple product photos, specific descriptions, and visible stock signals help shoppers build a basket with more confidence.

The result is a calmer buying process with less waste, fewer forgotten items, and a stronger sense of control over weekly household spending.`,
  },
  "what-makes-a-trustworthy-online-food-store": {
    title: "What Makes a Trustworthy Online Food Store",
    excerpt: "We break down the signs of a reliable ecommerce grocery website, from legal pages to product detail quality.",
    body: `Trust on the internet is built through structure as much as design.

A reliable online store should clearly show who runs the website, how visitors can get support, what the privacy policy says, and what terms apply to site use. These pages signal legitimacy to both users and advertising platforms.

Product pages are another strong indicator. When the site presents multiple images, useful descriptions, and clearer shopper guidance, the experience feels much more credible than a generic one-photo listing.

Editorial content also helps. Helpful buying guides, service information, and business explanations make the platform more useful to visitors and easier for search engines to understand.

In short, a trustworthy ecommerce site does more than list products. It provides clarity, accountability, and a reason for visitors to return.`,
  },
};

export default function BlogPost() {
  const { t, market } = useI18n();
  const { slug = "" } = useParams<{ slug: string }>();
  const [post, setPost] = useState<{ title: string; body: string; excerpt: string } | null>(null);

  useEffect(() => {
    fetch(`/api/blog/posts/${slug}?lang=${encodeURIComponent(getStoredLanguageCode())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => setPost(row || fallbackPosts[slug] || null))
      .catch(() => setPost(fallbackPosts[slug] || null));
  }, [market.language, slug]);

  useSeo(post ? `${post.title} - UrugoBuy` : t("blog.metaTitle"), post?.excerpt || t("blog.postDescription"), {
    canonicalPath: post ? `/blog/${slug}` : "/blog",
    type: "article",
  });

  if (!post) {
    return <div className="min-h-screen px-4 pt-24">{t("blog.postNotFound")}</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 font-display text-4xl font-bold">{post.title}</h1>
        <p className="mb-6 text-lg text-muted-foreground">{post.excerpt}</p>
        <article className="prose prose-zinc max-w-none whitespace-pre-line leading-relaxed">
          {post.body}
        </article>
      </div>
    </div>
  );
}
