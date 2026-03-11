import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useSeo } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function Shop() {
  const { t, formatCurrency } = useI18n();
  useSeo(t("shop.metaTitle"), t("shop.metaDescription"), { canonicalPath: "/shop" });
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Parse query params for initial state
  const initialCategory = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const initialSearch = searchParams.get("search") || "";
  const initialFeatured = searchParams.get("featured") === "true";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const initialSort =
    (searchParams.get("sort") as "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc") ||
    "newest";

  const [activeCategory, setActiveCategory] = useState<number | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialFeatured);
  const [showInStockOnly, setShowInStockOnly] = useState(initialInStock);
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice !== undefined ? String(initialMinPrice) : "");
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice !== undefined ? String(initialMaxPrice) : "");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc">(initialSort);
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("shop.title")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {t("shop.subtitle")}
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? t("shop.loadingProducts") : totalProducts === 1 ? t("shop.productFound", { count: totalProducts }) : t("shop.productsFound", { count: totalProducts })}
          </p>
          <div className="inline-flex items-center gap-2">
            <label htmlFor="sortBy" className="text-sm text-muted-foreground">{t("shop.sort")}</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="newest">{t("shop.sortNewest")}</option>
              <option value="price-asc">{t("shop.sortPriceAsc")}</option>
              <option value="price-desc">{t("shop.sortPriceDesc")}</option>
              <option value="rating-desc">{t("shop.sortRating")}</option>
              <option value="name-asc">{t("shop.sortName")}</option>
            </select>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={filter.onClick}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filter.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Mobile Filter Toggle */}
          <div className="w-full md:hidden flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={t("shop.searchShort")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-muted/50 border-transparent"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="rounded-full px-4 shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t("shop.filters")}
            </Button>
          </div>

          {/* Sidebar / Filters */}
          <div className={`w-full md:w-64 shrink-0 space-y-8 ${isFiltersOpen ? 'block' : 'hidden md:block'}`}>
            
            {/* Desktop Search */}
            <div className="hidden md:block relative">
              <Input
                placeholder={t("shop.searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-muted/30 border-border"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">{t("shop.categories")}</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {t("shop.clearAll")}
                  </button>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveCategory(undefined)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === undefined ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {t("shop.allCategories")}
                </button>
                {categories?.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === category.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">{t("shop.collections")}</h3>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showFeaturedOnly}
                    onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">{t("shop.featuredOnly")}</span>
                </label>
                <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showInStockOnly}
                    onChange={(e) => setShowInStockOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">{t("shop.inStockOnly")}</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">{t("shop.priceRange")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={t("shop.min")}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="rounded-lg bg-muted/30 border-border"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder={t("shop.max")}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-lg bg-muted/30 border-border"
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6 hidden md:flex">
                {activeCategory !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {categories?.find(c => c.id === activeCategory)?.name || t("shop.categoryTag")}
                    <button onClick={() => setActiveCategory(undefined)} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {showFeaturedOnly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {t("shop.quickFeatured")}
                    <button onClick={() => setShowFeaturedOnly(false)} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {showInStockOnly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {t("shop.quickStock")}
                    <button onClick={() => setShowInStockOnly(false)} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {minPrice !== "" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {t("shop.minTag", { amount: formatCurrency(minPrice) })}
                    <button onClick={() => setMinPrice("")} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {maxPrice !== "" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {t("shop.maxTag", { amount: formatCurrency(maxPrice) })}
                    <button onClick={() => setMaxPrice("")} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {sortBy !== "newest" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    {t("shop.sortTag", { value: sortBy })}
                    <button onClick={() => setSortBy("newest")} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {debouncedSearch && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    "{debouncedSearch}"
                    <button onClick={() => setSearchQuery("")} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-3xl bg-muted/10">
                <h3 className="font-display text-xl font-medium mb-2">{t("shop.loadError")}</h3>
                <p className="text-muted-foreground mb-6">{t("shop.loadErrorBody")}</p>
              </div>
            ) : totalProducts === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-3xl bg-muted/10">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-display text-xl font-medium mb-2">{t("shop.noneFound")}</h3>
                <p className="text-muted-foreground mb-6">{t("shop.noneFoundBody")}</p>
                <Button variant="outline" onClick={clearFilters} className="rounded-full">
                  {t("shop.clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {t("shop.showingRange", {
                    start: Math.min((currentPage - 1) * pageSize + 1, totalProducts),
                    end: Math.min(currentPage * pageSize, totalProducts),
                    total: totalProducts,
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      {t("shop.previous")}
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
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
