import { Link } from "wouter";
import { Star, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { normalizeProductImageUrl } from "@/lib/images";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const isOutOfStock = product.stockQuantity <= 0;
  const imageContext = {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
  };
  const primaryImage = normalizeProductImageUrl(product.imageUrl, product.id, imageContext);
  const [imageSrc, setImageSrc] = useState(primaryImage);

  useEffect(() => {
    setImageSrc(primaryImage);
  }, [primaryImage]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in Link
    if (isOutOfStock) {
      toast({
        variant: "destructive",
        title: "Out of stock",
        description: `${product.name} is currently unavailable.`,
      });
      return;
    }
    addItem(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col bg-card rounded-xl sm:rounded-2xl overflow-hidden card-hover border border-border"
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-square sm:aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageSrc(normalizeProductImageUrl(undefined, product.id, imageContext))}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.isFeatured && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 rounded-full">
            Featured
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 rounded-full">
            Out of stock
          </div>
        )}
      </Link>
      
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex items-center space-x-1 mb-1.5 sm:mb-2">
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-accent text-accent" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            {Number(product.rating).toFixed(1)}
          </span>
        </div>
        
        <Link href={`/product/${product.id}`} className="block group-hover:underline decoration-2 underline-offset-4 decoration-primary/30">
          <h3 className="font-display font-semibold text-base sm:text-lg text-foreground line-clamp-1">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2 mb-3 sm:mb-4 flex-grow">
          {product.description || "Fresh and quality product from our store."}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-border/50">
          <span className="font-display font-bold text-lg sm:text-xl text-foreground">
            ${Number(product.price).toFixed(2)}
          </span>
          <Button 
            onClick={handleAddToCart} 
            size="sm" 
            disabled={isOutOfStock}
            className="rounded-full h-8 sm:h-9 px-3 sm:px-5 text-xs sm:text-sm font-medium transition-transform active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
