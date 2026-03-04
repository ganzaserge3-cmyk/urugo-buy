import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-cart";
import { Separator } from "@/components/ui/separator";
import { normalizeProductImageUrl } from "@/lib/images";

export function CartSheet() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isOpen && items.length === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="font-display flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Looks like you haven't added anything yet.
              </p>
              <Button onClick={() => setIsOpen(false)} asChild className="rounded-full">
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={normalizeProductImageUrl(item.imageUrl, item.id)} 
                      alt={item.name} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/logo-house.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-foreground line-clamp-1 pr-4">{item.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <span className="font-display font-semibold mt-1">
                      ${Number(item.price).toFixed(2)}
                    </span>
                    
                    <div className="flex items-center space-x-3 mt-auto">
                      <div className="flex items-center border border-border rounded-full p-1 bg-background">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="p-6 bg-muted/30 border-t border-border">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${totalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between font-display font-bold text-lg">
                <span>Total</span>
                <span>${totalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full rounded-full py-6 text-base" size="lg" asChild>
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                Proceed to Checkout
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full rounded-full" 
                onClick={() => {
                  clearCart();
                  setIsOpen(false);
                }}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
