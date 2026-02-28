import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Parse query params for initial state
  const initialCategory = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const initialSearch = searchParams.get("search") || "";
  const initialFeatured = searchParams.get("featured") === "true";

  const [activeCategory, setActiveCategory] = useState<number | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialFeatured);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    categoryId: activeCategory,
    search: debouncedSearch || undefined,
    featured: showFeaturedOnly ? true : undefined,
  });

  const clearFilters = () => {
    setActiveCategory(undefined);
    setSearchQuery("");
    setShowFeaturedOnly(false);
  };

  const hasActiveFilters = activeCategory !== undefined || searchQuery !== "" || showFeaturedOnly;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">All Products</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Explore our complete collection. Crafted with precision, designed for longevity.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Mobile Filter Toggle */}
          <div className="w-full md:hidden flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search..."
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
              Filters
            </Button>
          </div>

          {/* Sidebar / Filters */}
          <div className={`w-full md:w-64 shrink-0 space-y-8 ${isFiltersOpen ? 'block' : 'hidden md:block'}`}>
            
            {/* Desktop Search */}
            <div className="hidden md:block relative">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-muted/30 border-border"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Categories</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Clear all
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
                  All Categories
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
              <h3 className="font-display font-semibold text-lg">Collections</h3>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showFeaturedOnly}
                    onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">Featured Only</span>
                </label>
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
                    {categories?.find(c => c.id === activeCategory)?.name || 'Category'}
                    <button onClick={() => setActiveCategory(undefined)} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </span>
                )}
                {showFeaturedOnly && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    Featured
                    <button onClick={() => setShowFeaturedOnly(false)} className="ml-2 hover:text-destructive"><X className="w-3 h-3"/></button>
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
            ) : products?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-3xl bg-muted/10">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-display text-xl font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
                <Button variant="outline" onClick={clearFilters} className="rounded-full">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
