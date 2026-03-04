import { useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingBag, ArrowLeft, Check, ShieldCheck, Package, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBundleSuggestions, useCompareProducts, useProduct, useRecommendations } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useReviews, useCreateReview } from "@/hooks/use-reviews";
import { useAuth } from "@/hooks/use-auth";
import { useWatchProductAlert } from "@/hooks/use-account";
import { ProductCard } from "@/components/ProductCard";
import { useSeo } from "@/hooks/use-seo";
import { authFetch } from "@/lib/auth";
import { buildProductImageGallery, normalizeProductImageUrl } from "@/lib/images";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: product, isLoading } = useProduct(id);
  const { data: recommended = [] } = useRecommendations(id);
  const { data: bundles = [] } = useBundleSuggestions(id);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const isOutOfStock = product ? product.stockQuantity <= 0 : false;
  const [imageSrc, setImageSrc] = useState<string>("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState("");
  const [reviewVideoUrl, setReviewVideoUrl] = useState("");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [selectedPack, setSelectedPack] = useState("Single");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, number>>({});
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [questions, setQuestions] = useState<Array<{
    id: number;
    question: string;
    answer?: string | null;
    answeredBy?: string | null;
    answeredAt?: string | null;
  }>>([]);
  const [questionText, setQuestionText] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const { data: wishlist = [] } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const { data: reviews = [] } = useReviews(id);
  const createReview = useCreateReview(id);
  const watchProductAlert = useWatchProductAlert();
  const { data: compared = [] } = useCompareProducts(compareIds);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useSeo(
    product ? `${product.name} - UrugoBuy` : "Product - UrugoBuy",
    product ? product.description : "View product details, reviews, and recommendations.",
  );

  const productImages = useMemo(() => {
    if (!product) return ["/logo-house.png"];
    return buildProductImageGallery({
      imageUrl: product.imageUrl,
      imageGallery: Array.isArray((product as any).imageGallery) ? (product as any).imageGallery as string[] : [],
      productId: product.id,
    });
  }, [product]);

  useEffect(() => {
    if (!product) {
      setActiveImageIndex(0);
      setImageSrc("/logo-house.png");
      return;
    }
    setActiveImageIndex(0);
    setImageSrc(productImages[0] || "/logo-house.png");
  }, [product?.id, productImages]);

  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem("recently-viewed-products");
      const ids = raw ? JSON.parse(raw) : [];
      const next = [product.id, ...(Array.isArray(ids) ? ids.filter((v: number) => v !== product.id) : [])].slice(0, 8);
      localStorage.setItem("recently-viewed-products", JSON.stringify(next));
    } catch {
      localStorage.setItem("recently-viewed-products", JSON.stringify([product.id]));
    }
  }, [product?.id]);

  useEffect(() => {
    const raw = localStorage.getItem("compare-products");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCompareIds(parsed.filter((n) => Number.isFinite(n)));
      }
    } catch {
      setCompareIds([]);
    }
  }, []);

  useEffect(() => {
    if (!product) return;
    fetch(`/api/products/${product.id}/questions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setQuestions(Array.isArray(rows) ? rows : []))
      .catch(() => setQuestions([]));
  }, [product?.id]);

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

  const inWishlist = wishlist.some((item: { id: number }) => item.id === product.id);

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist.mutateAsync({ productId: product.id, inWishlist });
      toast({ title: inWishlist ? "Removed from wishlist" : "Added to wishlist" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wishlist update failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleWatchAlert = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login required", description: "Please login to track product alerts." });
      return;
    }
    try {
      const parsed = alertTargetPrice.trim() ? Number(alertTargetPrice) : undefined;
      await watchProductAlert.mutateAsync({
        productId: product.id,
        targetPrice: Number.isFinite(parsed) ? parsed : undefined,
        notifyOnPriceDrop: true,
        notifyOnRestock: true,
      });
      toast({ title: "Alert saved", description: "You will be notified on price drops or restock." });
      setAlertTargetPrice("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Alert failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({
        rating: reviewRating,
        comment: reviewComment,
        photoUrl: reviewPhotoUrl || undefined,
        videoUrl: reviewVideoUrl || undefined,
      });
      setReviewComment("");
      setReviewRating(5);
      setReviewPhotoUrl("");
      setReviewVideoUrl("");
      toast({ title: "Review submitted" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Review failed",
        description: error instanceof Error ? error.message : "Please login and try again",
      });
    }
  };

  const inCompare = compareIds.includes(product.id);
  const hasMultipleImages = productImages.length > 1;
  const variantStock = Math.max(0, product.stockQuantity - (selectedPack === "Family Pack" ? 2 : 0));
  const goToImage = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, productImages.length - 1));
    setActiveImageIndex(nextIndex);
    setImageSrc(productImages[nextIndex] || "/logo-house.png");
  };
  const goToPrevImage = () => {
    if (!hasMultipleImages) return;
    const nextIndex = activeImageIndex === 0 ? productImages.length - 1 : activeImageIndex - 1;
    goToImage(nextIndex);
  };
  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    const nextIndex = activeImageIndex === productImages.length - 1 ? 0 : activeImageIndex + 1;
    goToImage(nextIndex);
  };
  const toggleCompare = () => {
    const next = inCompare
      ? compareIds.filter((idValue) => idValue !== product.id)
      : [...compareIds, product.id].slice(-4);
    setCompareIds(next);
    localStorage.setItem("compare-products", JSON.stringify(next));
  };

  const handleHelpfulVote = (reviewId: number) => {
    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/products/${product.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionText }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Question failed" });
      return;
    }
    setQuestionText("");
    const rows = await fetch(`/api/products/${product.id}/questions`).then((r) => (r.ok ? r.json() : []));
    setQuestions(Array.isArray(rows) ? rows : []);
  };

  const answerQuestion = async (questionId: number) => {
    const answer = answerDrafts[questionId];
    if (!answer) return;
    const res = await authFetch(`/api/admin/questions/${questionId}/answer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Answer failed" });
      return;
    }
    const rows = await fetch(`/api/products/${product.id}/questions`).then((r) => (r.ok ? r.json() : []));
    setQuestions(Array.isArray(rows) ? rows : []);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Images */}
          <div>
            <div className="aspect-[4/5] md:aspect-square bg-muted rounded-[2rem] overflow-hidden border border-border relative">
              <img 
                src={imageSrc}
                alt={product.name} 
                onError={() => setImageSrc(normalizeProductImageUrl(undefined, product.id))}
                className="w-full h-full object-cover"
              />
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition"
                    aria-label="Previous product image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition"
                    aria-label="Next product image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {productImages.map((_, index) => (
                      <button
                        key={`${product.id}-dot-${index}`}
                        type="button"
                        onClick={() => goToImage(index)}
                        aria-label={`View product image ${index + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition ${index === activeImageIndex ? "bg-primary" : "bg-background/70"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {hasMultipleImages && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={`${product.id}-thumb-${index}`}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition ${index === activeImageIndex ? "border-primary" : "border-border"}`}
                    aria-label={`Select thumbnail ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      onError={(e) => {
                        const fallback = normalizeProductImageUrl(undefined, product.id + index + 100);
                        (e.currentTarget as HTMLImageElement).src = fallback;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
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
              <span className="ml-4 text-muted-foreground text-sm">
                {isOutOfStock ? "Out of Stock" : `${product.stockQuantity} in stock`}
              </span>
            </div>
            
            <div className="font-display text-3xl font-bold mb-8 text-primary">
              ${Number(product.price).toFixed(2)}
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-b border-border pb-8">
              {product.description || "Fresh and quality product from our store."}
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Size</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Large">Large</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Pack</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedPack}
                  onChange={(e) => setSelectedPack(e.target.value)}
                >
                  <option value="Single">Single</option>
                  <option value="2-Pack">2-Pack</option>
                  <option value="Family Pack">Family Pack</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              Variant stock: {variantStock} available
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
            
            <Button onClick={handleAddToCart} size="lg" disabled={isOutOfStock} className="w-full h-14 rounded-full text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0">
              <ShoppingBag className="w-5 h-5 mr-2" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button onClick={handleToggleWishlist} variant="outline" size="lg" className="w-full h-12 rounded-full mt-3">
              <Heart className={`w-5 h-5 mr-2 ${inWishlist ? "fill-current" : ""}`} />
              {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
            <Button onClick={toggleCompare} variant="outline" size="lg" className="w-full h-12 rounded-full mt-3">
              {inCompare ? "Remove from Compare" : "Add to Compare"}
            </Button>
            <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Target price (optional)"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
              />
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleWatchAlert}
                disabled={watchProductAlert.isPending}
              >
                Track Alert
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-full mt-3"
              onClick={async () => {
                const url = `${window.location.origin}/product/${product.id}`;
                if (navigator.share) {
                  await navigator.share({ title: product.name, url }).catch(() => undefined);
                } else {
                  await navigator.clipboard.writeText(url);
                  toast({ title: "Product link copied" });
                }
              }}
            >
              Share Product
            </Button>
          </div>
        </div>
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-3xl font-bold mb-4">Customer Reviews</h2>
          <form onSubmit={handleSubmitReview} className="grid md:grid-cols-[120px_1fr_auto] gap-3 mb-6">
            <Input
              type="number"
              min={1}
              max={5}
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              disabled={!user}
            />
            <Input
              placeholder={user ? "Write your review..." : "Login to leave a review"}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={!user}
              required
            />
            <Input
              placeholder="Photo URL (optional)"
              value={reviewPhotoUrl}
              onChange={(e) => setReviewPhotoUrl(e.target.value)}
              disabled={!user}
            />
            <Input
              placeholder="Video URL (optional)"
              value={reviewVideoUrl}
              onChange={(e) => setReviewVideoUrl(e.target.value)}
              disabled={!user}
            />
            <Button type="submit" disabled={!user || createReview.isPending}>Submit</Button>
          </form>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet.</p>
            ) : (
              reviews.map((review: { id: number; userEmail: string; rating: number; comment: string; photoUrl?: string | null; videoUrl?: string | null; verifiedPurchase?: boolean }) => (
                <div key={review.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.userEmail}</p>
                    {review.verifiedPurchase ? (
                      <span className="text-xs rounded-full bg-muted px-2 py-1">Verified purchase</span>
                    ) : (
                      <span className="text-xs rounded-full bg-muted px-2 py-1">Unverified</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Rating: {review.rating}/5</p>
                  <p className="mt-2">{review.comment}</p>
                  {review.photoUrl && (
                    <img src={review.photoUrl} alt="Review upload" className="mt-3 h-24 w-24 rounded-md object-cover border border-border" />
                  )}
                  {review.videoUrl && (
                    <video src={review.videoUrl} controls className="mt-3 h-32 w-56 rounded-md border border-border bg-black" />
                  )}
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => handleHelpfulVote(review.id)}>
                    Helpful ({helpfulVotes[review.id] || 0})
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-3xl font-bold mb-4">Product Q&A</h2>
          <form onSubmit={submitQuestion} className="flex gap-2 mb-6">
            <Input
              placeholder="Ask a question about this product..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
            <Button type="submit">Ask</Button>
          </form>
          <div className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-muted-foreground">No questions yet.</p>
            ) : (
              questions.map((item) => (
                <div key={item.id} className="border border-border rounded-xl p-4">
                  <p className="font-medium">Q: {item.question}</p>
                  {item.answer ? (
                    <div className="mt-2 text-muted-foreground">
                      <p>A: {item.answer}</p>
                      <p className="text-xs mt-1">
                        Answered {item.answeredBy ? `by ${item.answeredBy}` : ""}{item.answeredAt ? ` on ${new Date(item.answeredAt).toLocaleString()}` : ""}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">Awaiting answer</p>
                  )}
                  {user?.role === "admin" && !item.answer && (
                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder="Write answer"
                        value={answerDrafts[item.id] || ""}
                        onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <Button type="button" onClick={() => answerQuestion(item.id)}>Reply</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
        {compared.length >= 2 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-bold mb-4">Compare Products</h2>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Rating</th>
                    <th className="text-left p-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {compared.map((row: { id: number; name: string; price: string; rating: string; stockQuantity: number }) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">${Number(row.price).toFixed(2)}</td>
                      <td className="p-3">{Number(row.rating).toFixed(1)}</td>
                      <td className="p-3">{row.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {bundles.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-bold mb-6">Frequently Bought Together</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((item: any) => (
                <div key={`bundle-${item.id}`} className="space-y-2">
                  <ProductCard product={item} />
                  <p className="text-xs text-muted-foreground">
                    Bought together {item.pairCount} times
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {recommended.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((rec: any) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
