import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useSeo } from "@/hooks/use-seo";

export default function Blog() {
  useSeo("Blog - UrugoBuy", "News, updates, and buying guides.");
  const [posts, setPosts] = useState<Array<{ id: number; slug: string; title: string; excerpt: string }>>([]);

  useEffect(() => {
    fetch("/api/blog/posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setPosts(Array.isArray(rows) ? rows : []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-4xl font-bold mb-3">Blog</h1>
        <p className="text-muted-foreground mb-8">Guides, updates, and product stories.</p>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block border border-border rounded-xl p-4 hover:bg-muted/20">
              <h2 className="font-display text-2xl font-semibold">{post.title}</h2>
              <p className="text-muted-foreground mt-2">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

