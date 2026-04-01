import { useState, useEffect, useDeferredValue } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ShoppingBag, Search, Menu, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSearchSuggestions } from "@/hooks/use-products";
import { useI18n } from "@/lib/i18n";

type SearchSuggestion = {
  id: number;
  name: string;
  price?: string;
  categoryId?: number | null;
};

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const { data: suggestions = [] } = useSearchSuggestions(deferredSearchQuery);
  
  const { totalItems, setIsOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { market, markets, setMarketCode, t, formatCurrency, isRTL } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const openSuggestedProduct = (productId: number) => {
    setLocation(`/product/${productId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setIsMobileMenuOpen(false);
  };

  const getSuggestionCategory = (item: SearchSuggestion) => (
    item.categoryId === 1 ? t("nav.category.fruit") : item.categoryId === 2 ? t("nav.category.food") : t("nav.category.product")
  );

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.shop"), path: "/shop" },
    { name: t("nav.deals"), path: "/deals" },
    { name: t("footer.blog"), path: "/blog" },
    { name: t("footer.about"), path: "/about-us" },
    { name: t("footer.contact"), path: "/contact-us" },
    { name: t("nav.help"), path: "/faq" },
    ...(user ? [{ name: t("nav.account"), path: "/account" }] : []),
    ...(user?.role === "admin" ? [{ name: t("nav.admin"), path: "/admin" }] : []),
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? "glass-nav py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-display font-bold tracking-tighter sm:gap-4">
            <img src="/logo-house.png" alt="UrugoBuy logo" className="h-16 w-16 rounded-xl object-cover shadow-sm sm:h-14 sm:w-14 xl:h-16 xl:w-16" />
            <div className="leading-none">
              <span className="brand-logo-text text-4xl sm:text-3xl xl:text-4xl">UrugoBuy<span className="text-primary/50">.</span></span>
              <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-muted-foreground mt-1">
                {t("brand.tagline")}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`rounded-full px-2 py-1 text-sm font-medium transition-colors hover:text-primary ${
                  location === link.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden xl:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("nav.market")}</span>
              <select
                value={market.code}
                onChange={(e) => setMarketCode(e.target.value as typeof market.code)}
                className="rounded-full border border-border bg-background/70 px-3 py-2 text-foreground"
              >
                {markets.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {user ? (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("nav.greeting", { name: user.name })}</span>
                <Button variant="outline" className="rounded-full" onClick={logout}>
                  {t("nav.logout")}
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="ghost" className="rounded-full" asChild>
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button className="rounded-full" asChild>
                  <Link href="/signup">{t("nav.signup")}</Link>
                </Button>
              </div>
            )}
            
            {/* Desktop Search Toggle */}
            <div className="hidden sm:block relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="relative animate-in slide-in-from-right-4 fade-in duration-200">
                  <Input
                    autoFocus
                    placeholder={t("nav.searchProducts")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-44 lg:w-52 xl:w-64 rounded-full bg-background/50 backdrop-blur-sm ${isRTL ? "pr-4 pl-10" : "pl-4 pr-10"}`}
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-0 top-0 rounded-full hover:bg-transparent"
                    type="submit"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {suggestions.length > 0 && (
                    <div className="absolute top-12 left-0 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                      {suggestions.map((item: SearchSuggestion) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-3 py-3 text-sm hover:bg-muted"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            openSuggestedProduct(item.id);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getSuggestionCategory(item)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.price && <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>}
                              <span className="inline-flex items-center text-xs font-medium text-primary">
                                View details
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => setIsSearchOpen(true)} className="rounded-full">
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Theme Toggle */}
            <Button size="icon" variant="ghost" onClick={toggleTheme} className="rounded-full hidden sm:inline-flex">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Cart Button */}
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => setIsOpen(true)} 
              className="rounded-full relative border-border/50 bg-background/50 backdrop-blur-sm"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                  {totalItems()}
                </span>
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden rounded-full"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
        <div className="hidden xl:flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/about-us" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Shopping Guides</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-background border-b border-border shadow-xl animate-in slide-in-from-top-2">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <form onSubmit={handleSearch} className="relative mb-6">
              <Input
                placeholder={t("nav.searchShort")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-muted/50 border-transparent"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-4 top-3" />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {suggestions.map((item: SearchSuggestion) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        openSuggestedProduct(item.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{getSuggestionCategory(item)}</p>
                        </div>
                        <div className="text-right">
                          {item.price && <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>}
                          <p className="inline-flex items-center text-xs font-medium text-primary">
                            Details
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
            
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-2 py-2 text-lg font-medium rounded-lg ${
                  location === link.path ? "bg-muted text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-border pt-4 space-y-2">
              <Link href="/privacy-policy" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-2 text-sm text-muted-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" onClick={() => setIsMobileMenuOpen(false)} className="block px-2 py-2 text-sm text-muted-foreground">
                Terms & Conditions
              </Link>
            </div>

            {user ? (
              <Button
                variant="outline"
                className="rounded-full w-full"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
              >
                {t("nav.logout")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full flex-1" asChild>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>{t("nav.login")}</Link>
                </Button>
                <Button className="rounded-full flex-1" asChild>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>{t("nav.signup")}</Link>
                </Button>
              </div>
            )}
            
            <label className="flex items-center justify-between gap-3 px-2">
              <span className="font-medium">{t("nav.market")}</span>
              <select
                value={market.code}
                onChange={(e) => setMarketCode(e.target.value as typeof market.code)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm"
              >
                {markets.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium px-2">{t("nav.theme")}</span>
              <Button size="icon" variant="outline" onClick={toggleTheme} className="rounded-full">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
