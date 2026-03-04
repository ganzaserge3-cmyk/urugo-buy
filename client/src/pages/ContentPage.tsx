import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useSeo } from "@/hooks/use-seo";

export default function ContentPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; description: string; body: string } | null>(null);

  useEffect(() => {
    fetch(`/api/content/pages/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => setPage(row))
      .catch(() => setPage(null));
  }, [slug]);

  useSeo(page ? `${page.title} - UrugoBuy` : "Content - UrugoBuy", page?.description || "Content page");

  if (!page) {
    return <div className="min-h-screen pt-24 px-4">Page not found.</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl font-bold mb-3">{page.title}</h1>
        <p className="text-muted-foreground mb-4">{page.description}</p>
        <article className="whitespace-pre-line leading-relaxed">{page.body}</article>
      </div>
    </div>
  );
}

