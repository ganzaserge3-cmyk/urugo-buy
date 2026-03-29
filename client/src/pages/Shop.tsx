import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PackageCheck, Search, SlidersHorizontal, Sparkles, Truck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

type ShopSort = "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";

type ShopFilters = {
  category?: number;
  search: string;
  featured: boolean;
  inStock: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: ShopSort;
};

function parseFilters(search: string): ShopFilters {
  const searchParams = new URLSearchParams(search);

  return {
    category: searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined,
    search: searchParams.get("search") || "",
    featured: searchParams.get("featured") === "true",
    inStock: searchParams.get("inStock") === "true",
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sort: (searchParams.get("sort") as ShopSort) || "newest",
  };
}

export default function Shop() {
  const { t, formatCurrency } = useI18n();
  useSeo(t("shop.metaTitle"), t("shop.metaDescription"), { canonicalPath: "/shop" });
  const [location] = useLocation();
  const initialFilters = parseFilters(window.location.search);

  const [activeCategory, setActiveCategory] = useState<number | undefined>(initialFilters.category);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialFilters.featured);
  const [showInStockOnly, setShowInStockOnly] = useState(initialFilters.inStock);
  const [minPrice, setMinPrice] = useState<string>(initialFilters.minPrice !== undefined ? String(initialFilters.minPrice) : "");
  const [maxPrice, setMaxPrice] = useState<string>(initialFilters.maxPrice !== undefined ? String(initialFilters.maxPrice) : "");
  const [sortBy, setSortBy] = useState<ShopSort>(initialFilters.sort);
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const search = location.includes("?") ? location.slice(location.indexOf("?")) : "";
    const nextFilters = parseFilters(search);
    setActiveCategory(nextFilters.category);
    setSearchQuery(nextFilters.search);
    setDebouncedSearch(nextFilters.search);
    setShowFeaturedOnly(nextFilters.featured);
    setShowInStockOnly(nextFilters.inStock);
    setMinPrice(nextFilters.minPrice !== undefined ? String(nextFilters.minPrice) : "");
    setMaxPrice(nextFilters.maxPrice !== undefined ? String(nextFilters.maxPrice) : "");
    setSortBy(nextFilters.sort);
    setPage(1);
  }, [location]);

  const { data: categories } = useCategories();
  const parsedMinPrice = minPrice === "" ? undefined : Number(minPrice);
  const parsedMaxPrice = maxPrice === "" ? undefined : Number(maxPrice);
  const { data: products, isLoading, isError } = useProducts({
    categoryId: activeCategory,
    search: debouncedSearch || undefined,
    featured: showFeaturedOnly ? true : undefined,
    inStock: showInStockOnly ? true : undefined,
    minPrice: Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined,
    maxPrice: Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined,
    sort: sortBy,
  });

  useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedSearch, showFeaturedOnly, showInStockOnly, minPrice, maxPrice, sortBy]);

  const clearFilters = () => {
    setActiveCategory(undefined);
    setSearchQuery("");
    setShowFeaturedOnly(false);
    setShowInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    activeCategory !== undefined ||
    searchQuery !== "" ||
    showFeaturedOnly ||
    showInStockOnly ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortBy !== "newest";

  const pageSize = 12;
  const totalProducts = products?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = products?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
  const selectedCategoryName = categories?.find((category) => category.id === activeCategory)?.name;
  const featuredCount = products?.filter((product) => product.isFeatured).length ?? 0;
  const inStockCount = products?.filter((product) => product.stockQuantity > 0).length ?? 0;
  const heroSummary = useMemo(() => {
    if (debouncedSearch) {
      return `Results for "${debouncedSearch}"${selectedCategoryName ? ` in ${selectedCategoryName}` : ""}`;
    }
    if (selectedCategoryName) {
      return `${selectedCategoryName} picks ready to browse.`;
    }
    return "Fresh produce, pantry staples, and high-conviction picks for everyday orders.";
  }, [debouncedSearch, selectedCategoryName]);

  const quickFilters = [
    {
      label: t("shop.quickFeatured"),
      active: showFeaturedOnly,
      onClick: () => setShowFeaturedOnly((prev) => !prev),
    },
    {
      label: t("shop.quickStock"),
      active: showInStockOnly,
      onClick: () => setShowInStockOnly((prev) => !prev),
    },
    {
      label: t("shop.quickUnder", { amount: formatCurrency(10) }),
      active: minPrice === "" && maxPrice === "10",
      onClick: () => {
        setMinPrice("");
        setMaxPrice(maxPrice === "10" && minPrice === "" ? "" : "10");
      },
    },
    {
      label: t("shop.quickTopRated"),
      active: sortBy === "rating-desc",
      onClick: () => setSortBy((prev) => (prev === "rating-desc" ? "newest" : "rating-desc")),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="premium-surface relative overflow-hidden rounded-[2rem] border border-border/70 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.12),_transparent_58%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Curated storefront
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t("shop.title")}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t("shop.subtitle")}</p>
              <p className="mt-4 text-sm font-medium text-foreground/80">{heroSummary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={filter.onClick}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      filter.active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background/80 hover:bg-muted"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border bg-background/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{isLoading ? "..." : totalProducts}</p>
                    <p className="text-sm text-muted-foreground">Matching products</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-background/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-accent/15 p-3 text-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{isLoading ? "..." : featuredCount}</p>
                    <p className="text-sm text-muted-foreground">Featured picks</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-background/85 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{isLoading ? "..." : inStockCount}</p>
                    <p className="text-sm text-muted-foreground">Ready to ship</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col items-start gap-8 md:flex-row">
          <div className="flex w-full gap-2 md:hidden">
            <div className="relative flex-1">
              <Input
                placeholder={t("shop.searchShort")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full border-transparent bg-muted/50 pl-10"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="shrink-0 rounded-full px-4"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t("shop.filters")}
            </Button>
          </div>

          <aside className={`w-full shrink-0 md:w-72 ${isFiltersOpen ? "block" : "hidden md:block"}`}>
            <div className="space-y-6 md:sticky md:top-28">
              <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <div className="relative hidden md:block">
                  <Input
                    placeholder={t("shop.searchProducts")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-2xl border-border bg-muted/30 pl-10"
                  />
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                <div className="mt-0 space-y-4 md:mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">{t("shop.categories")}</h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-muted-foreground transition-colors hover:text-primary">
                        {t("shop.clearAll")}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setActiveCategory(undefined)}
                      className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        activeCategory === undefined ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t("shop.allCategories")}
                    </button>
                    {categories?.map((category) => (
                      <div key={category.id} className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveCategory(category.id)}
                          className={`flex-1 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            activeCategory === category.id ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {category.name}
                        </button>
                        <Link href={`/category/${category.slug}`} className="text-xs text-muted-foreground hover:text-primary">
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <h3 className="font-display text-lg font-semibold">{t("shop.collections")}</h3>
                <div className="flex flex-col space-y-2">
                  <label className="flex cursor-pointer items-center space-x-3 rounded-xl border border-transparent p-3 transition-colors hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={showFeaturedOnly}
                      onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{t("shop.featuredOnly")}</span>
                  </label>
                  <label className="flex cursor-pointer items-center space-x-3 rounded-xl border border-transparent p-3 transition-colors hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{t("shop.inStockOnly")}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{t("shop.priceRange")}</h3>
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Flexible</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder={t("shop.min")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="rounded-xl border-border bg-muted/30"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder={t("shop.max")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="rounded-xl border-border bg-muted/30"
                  />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Refine the assortment by budget, then sort for newest arrivals or strongest ratings.
                </p>
              </div>
            </div>
          </aside>

          <div className="w-full flex-1">
            <div className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? t("shop.loadingProducts")
                    : totalProducts === 1
                      ? t("shop.productFound", { count: totalProducts })
                      : t("shop.productsFound", { count: totalProducts })}
                </p>
                <p className="mt-1 text-sm text-foreground/75">
                  {selectedCategoryName ? `${selectedCategoryName} is currently selected.` : "Browsing all categories."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm text-muted-foreground">{t("shop.sort")}</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ShopSort)}
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm"
                >
                  <option value="newest">{t("shop.sortNewest")}</option>
                  <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                  <option value="price-desc">{t("shop.sortPriceDesc")}</option>
                  <option value="rating-desc">{t("shop.sortRating")}</option>
                  <option value="name-asc">{t("shop.sortName")}</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap gap-2">
                {activeCategory !== undefined && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {categories?.find((category) => category.id === activeCategory)?.name || t("shop.categoryTag")}
                    <button onClick={() => setActiveCategory(undefined)} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {showFeaturedOnly && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {t("shop.quickFeatured")}
                    <button onClick={() => setShowFeaturedOnly(false)} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {showInStockOnly && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {t("shop.quickStock")}
                    <button onClick={() => setShowInStockOnly(false)} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {minPrice !== "" && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {t("shop.minTag", { amount: formatCurrency(minPrice) })}
                    <button onClick={() => setMinPrice("")} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {maxPrice !== "" && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {t("shop.maxTag", { amount: formatCurrency(maxPrice) })}
                    <button onClick={() => setMaxPrice("")} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {sortBy !== "newest" && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    {t("shop.sortTag", { value: sortBy })}
                    <button onClick={() => setSortBy("newest")} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {debouncedSearch && (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                    "{debouncedSearch}"
                    <button onClick={() => setSearchQuery("")} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-[400px] animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 py-20 text-center">
                <h3 className="mb-2 font-display text-xl font-medium">{t("shop.loadError")}</h3>
                <p className="mb-6 text-muted-foreground">{t("shop.loadErrorBody")}</p>
              </div>
            ) : totalProducts === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 py-20 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mb-2 font-display text-xl font-medium">{t("shop.noneFound")}</h3>
                <p className="mb-6 text-muted-foreground">{t("shop.noneFoundBody")}</p>
                <Button variant="outline" onClick={clearFilters} className="rounded-full">
                  {t("shop.clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {t("shop.showingRange", {
                      start: Math.min((currentPage - 1) * pageSize + 1, totalProducts),
                      end: Math.min(currentPage * pageSize, totalProducts),
                      total: totalProducts,
                    })}
                  </div>
                  <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    {showFeaturedOnly || showInStockOnly || minPrice !== "" || maxPrice !== ""
                      ? "Filters are refining this collection in real time."
                      : "Use filters to tighten the assortment as you browse."}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      {t("shop.previous")}
                    </Button>
                    <span className="px-2 text-sm text-muted-foreground">
                      {t("shop.pageOf", { page: currentPage, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full"
                    >
                      {t("shop.next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
