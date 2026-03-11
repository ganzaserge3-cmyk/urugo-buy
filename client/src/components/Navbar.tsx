import { useState, useEffect, useDeferredValue } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSearchSuggestions } from "@/hooks/use-products";
import { useI18n } from "@/lib/i18n";

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

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.shop"), path: "/shop" },
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
          <Link href="/" className="flex items-center gap-3 sm:gap-4 font-display font-bold tracking-tighter">
            <img src="/logo-house.png" alt="UrugoBuy logo" className="h-20 w-20 sm:h-16 sm:w-16 rounded-xl object-cover shadow-sm" />
            <div className="leading-none">
              <span className="brand-logo-text text-5xl sm:text-4xl">UrugoBuy<span className="text-primary/50">.</span></span>
              <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-muted-foreground mt-1">
                {t("brand.tagline")}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <label className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
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
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("nav.greeting", { name: user.name })}</span>
                <Button variant="outline" className="rounded-full" onClick={logout}>
                  {t("nav.logout")}
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
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
                    className={`w-48 lg:w-64 rounded-full bg-background/50 backdrop-blur-sm ${isRTL ? "pr-4 pl-10" : "pl-4 pr-10"}`}
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
                      {suggestions.map((item: { id: number; name: string; price?: string; categoryId?: number | null }) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setLocation(`/product/${item.id}`);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.categoryId === 1 ? t("nav.category.fruit") : item.categoryId === 2 ? t("nav.category.food") : t("nav.category.product")}
                              </p>
                            </div>
                            {item.price && <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>}
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
              className="md:hidden rounded-full"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border shadow-xl animate-in slide-in-from-top-2">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <form onSubmit={handleSearch} className="relative mb-6">
              <Input
                placeholder={t("nav.searchShort")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-muted/50 border-transparent"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-4 top-3" />
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
