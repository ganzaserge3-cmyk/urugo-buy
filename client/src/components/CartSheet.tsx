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
import { useProducts } from "@/hooks/use-products";
import { Separator } from "@/components/ui/separator";
import { normalizeProductImageUrl } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { estimateImportCharges, getMarketGuide } from "@/lib/international";

export function CartSheet() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart, addItem } = useCart();
  const { data: allProducts = [] } = useProducts();
  const { market, t, formatCurrency } = useI18n();
  const subtotal = totalPrice();
  const freeShippingThreshold = 100;
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const marketGuide = getMarketGuide(market.code);
  const importEstimate = estimateImportCharges(subtotal, market.code);
  const cartProductIds = new Set(items.map((item) => item.id));
  const cartCategoryIds = new Set(items.map((item) => item.categoryId).filter((value): value is number => value !== null));

  const suggestedProducts = allProducts
    .filter((product) => !cartProductIds.has(product.id) && product.stockQuantity > 0)
    .sort((a, b) => {
      const aCategoryBoost = cartCategoryIds.has(a.categoryId ?? -1) ? 1 : 0;
      const bCategoryBoost = cartCategoryIds.has(b.categoryId ?? -1) ? 1 : 0;
      return (
        bCategoryBoost - aCategoryBoost ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        Number(b.rating) - Number(a.rating) ||
        Number(a.price) - Number(b.price)
      );
    })
    .slice(0, 3);

  if (!isOpen && items.length === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="font-display flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            {t("cart.title", { count: items.length })}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-medium mb-2">{t("cart.emptyTitle")}</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {t("cart.emptyBody")}
              </p>
              <Button onClick={() => setIsOpen(false)} asChild className="rounded-full">
                <Link href="/shop">{t("cart.startShopping")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={normalizeProductImageUrl(item.imageUrl, item.id, {
                        name: item.name,
                      })} 
                      alt={item.name} 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = normalizeProductImageUrl(undefined, item.id, {
                          name: item.name,
                        });
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
                      {formatCurrency(item.price)}
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
              {suggestedProducts.length > 0 && (
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="mb-3">
                    <h3 className="font-display text-lg font-semibold">{t("cart.completeOrder")}</h3>
                    <p className="text-sm text-muted-foreground">{t("cart.completeOrderBody")}</p>
                  </div>
                  <div className="space-y-3">
                    {suggestedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
                        <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted flex-shrink-0">
                          <img
                            src={normalizeProductImageUrl(product.imageUrl, product.id, {
                              categoryId: product.categoryId,
                              name: product.name,
                              description: product.description,
                            })}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => addItem(product)}
                        >
                          {t("product.add")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">{t("cart.freeShippingProgress")}</span>
                  <span className="text-muted-foreground">{shippingProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full bg-primary transition-all" style={{ width: `${shippingProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {amountUntilFreeShipping > 0
                    ? t("cart.addMore", { amount: formatCurrency(amountUntilFreeShipping) })
                    : t("cart.unlocked")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-medium">{t("intl.landedCostTitle")}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t("intl.deliveryWindow", {
                      min: marketGuide.deliveryDays[0],
                      max: marketGuide.deliveryDays[1],
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(`intl.clearance.${marketGuide.clearanceLabel}`)}
                </p>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("intl.goodsValue")}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("intl.dutyEstimate")}</span>
                    <span>{formatCurrency(importEstimate.dutyEstimate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("intl.handlingEstimate")}</span>
                    <span>{formatCurrency(importEstimate.handlingEstimate)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
                    <span>{t("intl.estimatedLandedTotal")}</span>
                    <span>{formatCurrency(importEstimate.landedTotalEstimate)}</span>
                  </div>
                </div>
                {marketGuide.customsThreshold !== undefined && (
                  <p className="mt-3 text-xs text-amber-700">
                    {t("intl.customsThreshold", {
                      amount: formatCurrency(marketGuide.customsThreshold),
                    })}
                  </p>
                )}
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cart.subtotal")}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cart.shipping")}</span>
                <span>{t("cart.shippingAtCheckout")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-display font-bold text-lg">
                <span>{t("cart.total")}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full rounded-full py-6 text-base" size="lg" asChild>
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                {t("cart.checkout")}
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
                {t("cart.clear")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
