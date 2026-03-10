import { useEffect } from "react";

type SeoOptions = {
  canonicalPath?: string;
  robots?: string;
};

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let meta = document.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => meta?.setAttribute(key, value));
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function useSeo(title: string, description: string, options?: SeoOptions) {
  useEffect(() => {
    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="robots"]', { name: "robots" }, options?.robots || "index,follow");

    if (typeof window !== "undefined") {
      const href = options?.canonicalPath
        ? new URL(options.canonicalPath, window.location.origin).toString()
        : window.location.href;
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = href;
    }
  }, [description, options?.canonicalPath, options?.robots, title]);
}
