import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { totalItems, setIsOpen } = useCart();
  const { theme, toggleTheme } = useTheme();

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
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
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
          <Link href="/" className="font-display font-bold text-2xl tracking-tighter">
            AURA<span className="text-primary/50">.</span>
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
            
            {/* Desktop Search Toggle */}
            <div className="hidden sm:block relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="relative animate-in slide-in-from-right-4 fade-in duration-200">
                  <Input
                    autoFocus
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 lg:w-64 rounded-full pl-4 pr-10 bg-background/50 backdrop-blur-sm"
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
                placeholder="Search..."
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
            
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium px-2">Theme</span>
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
