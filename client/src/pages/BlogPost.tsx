import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useSeo } from "@/hooks/use-seo";
import { getStoredLanguageCode, useI18n } from "@/lib/i18n";

const fallbackPosts: Record<string, { title: string; excerpt: string; body: string }> = {
  "how-to-choose-quality-products-online-in-rwanda": {
    title: "How to Choose Quality Products Online in Rwanda",
    excerpt: "A practical guide to checking photos, descriptions, seller trust signals, and delivery details before you place an order.",
    body: `Choosing products online in Rwanda starts with clarity.

Start with the product page. A reliable online store should show a clear product title, readable photos, pricing that makes sense, and a description that tells you what you will actually receive. If a listing feels vague, shoppers are left guessing.

Next, compare quality signals. Look for useful details such as size, material, freshness notes, quantity, or usage information. For home, lifestyle, and grocery products, practical specifics matter much more than marketing language.

It also helps to review business trust pages. A serious store should make it easy to find its About page, Contact page, Privacy Policy, and Terms. These pages show that the business has taken the time to explain how it operates and how shoppers can get help.

Before placing an order, check delivery guidance and support options. In Rwanda especially, shoppers benefit from knowing where the business is based, how to ask a question, and what to expect if something needs clarification.

The goal is simple: choose stores that help you make informed decisions instead of rushing you through checkout with incomplete information.`,
  },
  "tips-for-safe-online-shopping": {
    title: "Tips for Safe Online Shopping",
    excerpt: "Learn simple ways to spot trustworthy stores, review product details carefully, and protect yourself while shopping online.",
    body: `Safe online shopping is usually about small habits, not complicated tools.

Start by checking the website itself. Does it have a clear navigation menu, working product pages, visible legal pages, and contact information you can actually use? Stores that hide these basics can feel less dependable.

Read product details instead of buying from the image alone. Good stores explain pricing, quantities, and product differences clearly. If the listing is too short or too confusing, it is better to pause and compare another option.

Use secure checkout habits too. Avoid entering sensitive information on pages that feel broken, unfinished, or suspicious. Make sure the business has a support path in case you need help with an order.

It is also smart to keep expectations realistic. Check order summaries, delivery details, and any return or support information before you confirm a purchase. Being careful before checkout is easier than solving a problem after payment.

The safest shopping experience comes from choosing websites that combine useful content, clear structure, and visible accountability.`,
  },
  "best-home-and-lifestyle-buying-tips": {
    title: "Best Home and Lifestyle Buying Tips",
    excerpt: "Build a smarter basket with practical tips for comparing everyday products, planning purchases, and choosing items that fit your home.",
    body: `Home and lifestyle shopping works best when you focus on usefulness before impulse.

Start with your actual needs. Whether you are buying kitchen items, home essentials, or everyday personal products, it helps to ask how often you will use the item and whether it solves a real problem in your routine.

Compare materials, dimensions, maintenance, and price together instead of looking at only one factor. A lower price is not always the better choice if the item is difficult to maintain or does not suit your space.

Read product descriptions carefully and think about context. A useful home product should match the size of your room, your family’s habits, and the way you actually live. Practical details are what make online buying easier.

Finally, shop from stores that make comparison easy. Helpful guides, clear categories, and readable product pages all improve decision-making and reduce the chance of buying something that does not fit your home.

The best buying tip is simple: choose with intention. When a website supports that process well, shopping feels calmer and more trustworthy.`,
  },
  "how-to-compare-prices-without-sacrificing-quality": {
    title: "How to Compare Prices Without Sacrificing Quality",
    excerpt: "A simple way to compare value, product details, and long-term usefulness instead of chasing the lowest number alone.",
    body: `Price comparison works best when you compare the full offer, not just the headline number.

Start by checking what is actually included. Two products can look similar at first glance while offering different sizes, materials, quantities, or support options. A cheaper product is not always better value if it needs replacing quickly or does not meet your needs.

Next, read the description carefully. Look for concrete details such as dimensions, pack size, materials, or compatibility. When stores provide useful product information, it becomes much easier to understand why one item costs more than another.

It also helps to think about total cost. Delivery timing, shipping fees, and whether you may need to return or replace the item can affect the real value of a purchase. A slightly higher price from a clearer, better-supported store can be the smarter option.

Another useful habit is to compare products within the same category instead of jumping between unrelated listings. Good category pages, filters, and side-by-side details make decision-making easier and reduce guesswork.

The goal is not to spend more. The goal is to spend more carefully. When a store gives you enough information to compare price with quality, you can choose with more confidence.`,
  },
  "questions-to-ask-before-buying-household-items-online": {
    title: "Questions to Ask Before Buying Household Items Online",
    excerpt: "Use this quick checklist to judge size, material, durability, delivery fit, and support before you commit to a purchase.",
    body: `Household products are easier to buy online when you slow down and ask a few practical questions first.

Start with size and fit. Will the item work in the room, shelf, or routine you have in mind? Product photos can be helpful, but dimensions and usage notes are what keep you from buying something that feels wrong after delivery.

Then check material and maintenance. Is the item easy to clean, sturdy enough for regular use, and appropriate for the people who will use it most? A product that looks attractive online should still make sense in everyday life.

Ask whether the description answers the basics. A strong listing should explain what the item is for, what is included, and any important details about care, storage, or compatibility. If the page leaves too many questions unanswered, it may be better to keep comparing.

It is also wise to review the support path before you buy. Can you easily contact the store if something is unclear? Are the policy pages and contact details easy to find? Trust becomes much stronger when a website explains how it handles questions and orders.

Buying household items online should feel informed, not rushed. A simple checklist helps you choose products that truly fit your needs and your home.`,
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
