import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useSeo } from "@/hooks/use-seo";

export default function BlogPost() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [post, setPost] = useState<{ title: string; body: string; excerpt: string } | null>(null);

  useEffect(() => {
    fetch(`/api/blog/posts/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => setPost(row))
      .catch(() => setPost(null));
  }, [slug]);

  useSeo(post ? `${post.title} - UrugoBuy` : "Blog - UrugoBuy", post?.excerpt || "Blog article");

  if (!post) {
    return <div className="min-h-screen pt-24 px-4">Post not found.</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{post.body}</p>
      </div>
    </div>
  );
}

