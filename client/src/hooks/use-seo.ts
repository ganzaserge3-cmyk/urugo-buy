import { useEffect } from "react";

type SeoOptions = {
  canonicalPath?: string;
  robots?: string;
  image?: string;
  keywords?: string[];
  type?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
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

function upsertLink(selector: string, attributes: Record<string, string>) {
  let link = document.querySelector(selector) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    document.head.appendChild(link);
  }
  Object.entries(attributes).forEach(([key, value]) => link?.setAttribute(key, value));
}

function upsertScript(selector: string, payload: Record<string, unknown> | Array<Record<string, unknown>>) {
  let script = document.querySelector(selector) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "json-ld");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

export function useSeo(title: string, description: string, options?: SeoOptions) {
  useEffect(() => {
    const siteName = "UrugoBuy";
    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[name="keywords"]', { name: "keywords" }, options?.keywords?.join(", ") || "fresh fruits, groceries, food delivery, UrugoBuy");
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, options?.type || "website");
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name" }, siteName);
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="robots"]', { name: "robots" }, options?.robots || "index,follow");

    if (typeof window !== "undefined") {
      const href = options?.canonicalPath
        ? new URL(options.canonicalPath, window.location.origin).toString()
        : window.location.href;
      const image = options?.image
        ? new URL(options.image, window.location.origin).toString()
        : new URL("/logo-house.png", window.location.origin).toString();

      upsertMeta('meta[property="og:url"]', { property: "og:url" }, href);
      upsertMeta('meta[property="og:image"]', { property: "og:image" }, image);
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, image);
      upsertLink('link[rel="canonical"]', { rel: "canonical", href });

      if (options?.jsonLd) {
        upsertScript('script[data-seo="json-ld"]', options.jsonLd);
      } else {
        document.querySelector('script[data-seo="json-ld"]')?.remove();
      }
    }
  }, [description, options?.canonicalPath, options?.image, options?.jsonLd, options?.keywords, options?.robots, options?.type, title]);
}
