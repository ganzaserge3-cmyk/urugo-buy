import { Link } from "wouter";
import { Star, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { normalizeProductImageUrl } from "@/lib/images";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const isOutOfStock = product.stockQuantity <= 0;
  const primaryImage = normalizeProductImageUrl(product.imageUrl, product.id);
  const [imageSrc, setImageSrc] = useState(primaryImage);

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
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden card-hover border border-border"
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageSrc("/logo-house.png")}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.isFeatured && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            Featured
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
            Out of stock
          </div>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center space-x-1 mb-2">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span className="text-sm font-medium text-muted-foreground">
            {Number(product.rating).toFixed(1)}
          </span>
        </div>
        
        <Link href={`/product/${product.id}`} className="block group-hover:underline decoration-2 underline-offset-4 decoration-primary/30">
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2 mb-4 flex-grow">
          {product.description || "Fresh and quality product from our store."}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <span className="font-display font-bold text-xl text-foreground">
            ${Number(product.price).toFixed(2)}
          </span>
          <Button 
            onClick={handleAddToCart} 
            size="sm" 
            disabled={isOutOfStock}
            className="rounded-full px-5 font-medium transition-transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
