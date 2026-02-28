import { useParams } from "wouter";
import { Star, ShoppingBag, ArrowLeft, Check, ShieldCheck, Package } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: product, isLoading } = useProduct(id);
  const { addItem } = useCart();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto flex animate-pulse">
        <div className="w-full md:w-1/2 aspect-square bg-muted rounded-3xl mr-12" />
        <div className="w-full md:w-1/2 space-y-6 pt-8">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-24 bg-muted rounded w-full mt-8" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-4">
        <h1 className="font-display text-4xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="rounded-full"><Link href="/shop">Back to Shop</Link></Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Images */}
          <div className="aspect-[4/5] md:aspect-square bg-muted rounded-[2rem] overflow-hidden border border-border">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Details */}
          <div className="flex flex-col justify-center">
            {product.isFeatured && (
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground mb-4 w-max">
                <Star className="w-3 h-3 mr-1 fill-current" /> Featured Product
              </div>
            )}
            
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
              {product.name}
            </h1>
            
            <div className="flex items-center mb-6">
              <div className="flex items-center mr-4">
                <Star className="w-5 h-5 fill-accent text-accent" />
                <span className="ml-1.5 font-medium">{Number(product.rating).toFixed(1)} Rating</span>
              </div>
              <span className="text-muted-foreground text-sm">|</span>
              <span className="ml-4 text-muted-foreground text-sm">In Stock</span>
            </div>
            
            <div className="font-display text-3xl font-bold mb-8 text-primary">
              ${Number(product.price).toFixed(2)}
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-b border-border pb-8">
              {product.description}
            </p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                Premium materials and build quality
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                2-year extended warranty included
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                Free express shipping on orders over $50
              </div>
            </div>
            
            <Button onClick={handleAddToCart} size="lg" className="w-full h-14 rounded-full text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
