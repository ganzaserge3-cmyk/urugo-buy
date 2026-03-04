import { Link, useParams } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useSharedWishlist, useImportSharedWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SharedWishlist() {
  const { token = "" } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useSharedWishlist(token);
  const importWishlist = useImportSharedWishlist();
  const { user } = useAuth();
  const { toast } = useToast();
  useSeo("Shared Wishlist - UrugoBuy", "Browse products from a shared wishlist.");

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[360px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || data === null) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto border border-border rounded-2xl p-8 text-center bg-card">
          <h1 className="font-display text-3xl font-bold mb-2">Share Link Invalid</h1>
          <p className="text-muted-foreground mb-6">This wishlist share link is expired or unavailable.</p>
          <Button asChild className="rounded-full">
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(data) ? data : [];

  const handleImport = async () => {
    try {
      const result = await importWishlist.mutateAsync(token);
      toast({
        title: "Wishlist imported",
        description: `${result.imported} item${result.imported === 1 ? "" : "s"} added to your wishlist.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold mb-2">Shared Wishlist</h1>
        <p className="text-muted-foreground mb-8">{items.length} saved item{items.length === 1 ? "" : "s"}</p>
        {user && items.length > 0 && (
          <div className="mb-6">
            <Button onClick={handleImport} disabled={importWishlist.isPending} className="rounded-full">
              Import To My Wishlist
            </Button>
          </div>
        )}
        {items.length === 0 ? (
          <div className="border border-border rounded-2xl p-8 bg-card text-center">
            <p className="text-muted-foreground">No products in this shared wishlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

