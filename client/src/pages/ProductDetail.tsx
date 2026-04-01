import { useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingBag, ArrowLeft, Check, ShieldCheck, Package, Heart, ChevronLeft, ChevronRight, X, Info, Truck, ClipboardList } from "lucide-react";
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
import { useI18n } from "@/lib/i18n";
import { getCompareProductIds, saveCompareProductIds } from "@/lib/compare";
import { estimateImportCharges, getMarketGuide } from "@/lib/international";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: product, isLoading } = useProduct(id);
  const { data: recommended = [] } = useRecommendations(id);
  const { data: bundles = [] } = useBundleSuggestions(id);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { market, t, formatCurrency, formatNumber, formatDateTime } = useI18n();
  const { user } = useAuth();
  const isOutOfStock = product ? product.stockQuantity <= 0 : false;
  const [imageSrc, setImageSrc] = useState<string>("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState("");
  const [reviewVideoUrl, setReviewVideoUrl] = useState("");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [selectedSize, setSelectedSize] = useState("standard");
  const [selectedPack, setSelectedPack] = useState("single");
  const [quantity, setQuantity] = useState(1);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, number>>({});
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
  const imageContext = useMemo(() => ({
    categoryId: product?.categoryId,
    name: product?.name,
    description: product?.description,
  }), [product?.categoryId, product?.description, product?.name]);
  const reviewAverage = reviews.length > 0
    ? reviews.reduce((sum: number, review: { rating: number }) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const verifiedReviewCount = reviews.filter((review: { verifiedPurchase?: boolean }) => review.verifiedPurchase).length;
  const mediaReviewCount = reviews.filter((review: { photoUrl?: string | null; videoUrl?: string | null }) => review.photoUrl || review.videoUrl).length;
  const marketGuide = getMarketGuide(market.code);
  const landedEstimate = estimateImportCharges(Number(product?.price || 0) * quantity, market.code);
  const primaryProductImage = product ? normalizeProductImageUrl(product.imageUrl, product.id, imageContext) : "/logo-house.png";
  const productJsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [primaryProductImage],
    sku: `urugobuy-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "UrugoBuy",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: market.currency,
      price: Number(product.price).toFixed(2),
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: typeof window !== "undefined" ? `${window.location.origin}/product/${product.id}` : `/product/${product.id}`,
    },
    aggregateRating: Number(product.rating) > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating).toFixed(1),
      reviewCount: Math.max(reviews.length, 1),
    } : undefined,
  } : undefined;

  const maskEmail = (value: string) => {
    const [local, domain] = value.split("@");
    if (!local || !domain) return value;
    const safeLocal = local.length <= 2
      ? `${local[0] || ""}*`
      : `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}`;
    return `${safeLocal}@${domain}`;
  };

  useSeo(
    product ? `${product.name} - UrugoBuy` : t("product.metaTitle"),
    product ? product.description : t("product.metaDescription"),
    {
      canonicalPath: product ? `/product/${product.id}` : "/shop",
      image: primaryProductImage,
      type: "product",
      keywords: product ? [product.name, "buy online", "fresh food", "UrugoBuy"] : ["product", "UrugoBuy"],
      jsonLd: productJsonLd,
    },
  );

  const productImages = useMemo(() => {
    if (!product) return ["/logo-house.png"];
    return buildProductImageGallery({
      imageUrl: product.imageUrl,
      imageGallery: Array.isArray((product as any).imageGallery) ? (product as any).imageGallery as string[] : [],
      productId: product.id,
      context: imageContext,
    });
  }, [imageContext, product]);

  useEffect(() => {
    if (!product) {
      setActiveImageIndex(0);
      setImageSrc("/logo-house.png");
      setQuantity(1);
      return;
    }
    setActiveImageIndex(0);
    setImageSrc(productImages[0] || "/logo-house.png");
    setQuantity(1);
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
    setCompareIds(getCompareProductIds());
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
        <h1 className="font-display text-4xl font-bold mb-4">{t("product.notFoundTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("product.notFound")}</p>
        <Button asChild className="rounded-full"><Link href="/shop">{t("product.backToShop")}</Link></Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        variant: "destructive",
        title: t("product.outOfStock"),
        description: t("product.unavailable", { name: product.name }),
      });
      return;
    }
    addItem(product, quantity);
    toast({
      title: t("product.addedToCart"),
      description: t("product.addedToCartBody", { quantity, name: product.name }),
    });
  };

  const inWishlist = wishlist.some((item: { id: number }) => item.id === product.id);

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist.mutateAsync({ productId: product.id, inWishlist });
      toast({ title: inWishlist ? t("product.removedFromWishlist") : t("product.addedToWishlist") });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("product.wishlistFailed"),
        description: error instanceof Error ? error.message : t("common.tryAgain"),
      });
    }
  };

  const handleWatchAlert = async () => {
    if (!user) {
      toast({ variant: "destructive", title: t("product.loginRequired"), description: t("product.trackAlertsLogin") });
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
      toast({ title: t("product.alertSaved"), description: t("product.alertSavedBody") });
      setAlertTargetPrice("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("product.alertFailed"),
        description: error instanceof Error ? error.message : t("common.tryAgain"),
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
      toast({ title: t("product.reviewSubmitted") });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("product.reviewFailed"),
        description: error instanceof Error ? error.message : t("product.reviewFailedBody"),
      });
    }
  };

  const inCompare = compareIds.includes(product.id);
  const hasMultipleImages = productImages.length > 1;
  const variantStock = Math.max(0, product.stockQuantity - (selectedPack === "family" ? 2 : 0));
  useEffect(() => {
    setQuantity((prev) => Math.max(1, Math.min(prev, Math.max(1, variantStock))));
  }, [variantStock]);
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
    saveCompareProductIds(next);
  };

  const handleHelpfulVote = (reviewId: number) => {
    setHelpfulVotes((prev) => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
  };

  const bestForMatch = product.description.match(/(?:ideal|perfect|great|suited|ready)\s+for\s+([^.]*)/i);
  const packageMatch = product.name.match(/(box|basket|punnet|bag|pack|tray|pair|duo|single|crate|tub|jar|bottle|dozen|loaf|fillet|bundle)/i);
  const productCategoryLabel = product.categoryId === 1 ? "Fresh produce" : product.categoryId === 2 ? "Food and pantry" : "Everyday essentials";
  const productDetailCards = [
    {
      title: "What you get",
      body: product.description,
    },
    {
      title: "Pack format",
      body: packageMatch
        ? `${packageMatch[0][0].toUpperCase()}${packageMatch[0].slice(1)} format prepared for ecommerce browsing and quick add-to-cart decisions.`
        : "Single product listing with clear quantity, pricing, and image coverage.",
    },
    {
      title: "Best for",
      body: bestForMatch
        ? bestForMatch[1][0].toUpperCase() + bestForMatch[1].slice(1)
        : product.categoryId === 1
          ? "Fresh snacking, breakfast prep, smoothies, and family fruit bowls."
          : "Meal prep, daily cooking, pantry restocking, and home kitchen planning.",
    },
    {
      title: "Shopper confidence",
      body: `${variantStock} units available right now with a ${formatNumber(product.rating)}/5 rating and a four-image gallery for closer inspection.`,
    },
  ];
  const productSpecRows = [
    { label: "Category", value: productCategoryLabel },
    { label: "Gallery views", value: `${productImages.length} product image${productImages.length === 1 ? "" : "s"}` },
    { label: "Selected size", value: selectedSize[0].toUpperCase() + selectedSize.slice(1) },
    { label: "Selected pack", value: selectedPack[0].toUpperCase() + selectedPack.slice(1) },
    { label: "Availability", value: isOutOfStock ? "Currently out of stock" : `${variantStock} units available` },
    { label: "Rating", value: `${formatNumber(product.rating)}/5` },
  ];
  const buyingHighlights = [
    "Multiple gallery views help shoppers inspect the product more clearly before adding it to cart.",
    "The product page combines pricing, stock, delivery guidance, reviews, and questions in one place.",
    "You can save the item, compare it, or share the product link before making a decision.",
  ];
  const deliverySupportCards = [
    {
      title: "Ordering guidance",
      body: "Review the product gallery, quantity, pack option, and delivery estimate before checkout so you know what to expect.",
    },
    {
      title: "Delivery expectations",
      body: `Current delivery guidance for ${market.label} is about ${marketGuide.deliveryDays[0]}-${marketGuide.deliveryDays[1]} days depending on stock readiness and destination.`,
    },
    {
      title: "Support path",
      body: "If something is unclear, shoppers can use the Contact page, product questions, or order tracking pages for follow-up support.",
    },
  ];
  const detailSections = [
    {
      id: "description",
      title: "Description",
      icon: Info,
      body: product.description || t("product.fallbackDescription"),
    },
    {
      id: "specifications",
      title: "Specifications",
      icon: ClipboardList,
      body: `Category: ${productCategoryLabel}. Selected size: ${selectedSize}. Selected pack: ${selectedPack}. Current stock visibility: ${variantStock} unit${variantStock === 1 ? "" : "s"} available for this selection.`,
    },
    {
      id: "delivery",
      title: "Delivery & support",
      icon: Truck,
      body: `Estimated delivery for ${market.label} is ${marketGuide.deliveryDays[0]}-${marketGuide.deliveryDays[1]} days. If you need help before or after ordering, you can use the product questions section, Contact page, or order tracking tools.`,
    },
  ] as const;

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/products/${product.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionText }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: t("product.questionFailed") });
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
      toast({ variant: "destructive", title: t("product.answerFailed") });
      return;
    }
    toast({
      title: t("product.answerPosted"),
      description: t("product.answerPostedBody"),
    });
    setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
    const rows = await fetch(`/api/products/${product.id}/questions`).then((r) => (r.ok ? r.json() : []));
    setQuestions(Array.isArray(rows) ? rows : []);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("product.backToShop")}
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Images */}
          <div className="self-start lg:sticky lg:top-28">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {productCategoryLabel}
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {productImages.length} gallery view{productImages.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                Zoomable product gallery
              </span>
            </div>
            <div className="aspect-[4/5] md:aspect-square bg-muted rounded-[2rem] overflow-hidden border border-border relative">
                <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="h-full w-full"
                aria-label={`Open larger gallery view for ${product.name}`}
              >
                <img 
                src={imageSrc}
                alt={product.name} 
                onError={() => setImageSrc(normalizeProductImageUrl(undefined, product.id, imageContext))}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
              </button>
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition"
                    aria-label={t("product.previousImage")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition"
                    aria-label={t("product.nextImage")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {productImages.map((_, index) => (
                      <button
                        key={`${product.id}-dot-${index}`}
                        type="button"
                        onClick={() => goToImage(index)}
                        aria-label={t("product.viewImage", { count: index + 1 })}
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
                  <div key={`${product.id}-thumb-wrap-${index}`} className="space-y-2">
                    <button
                    key={`${product.id}-thumb-${index}`}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition ${index === activeImageIndex ? "border-primary" : "border-border"}`}
                    aria-label={t("product.selectThumbnail", { count: index + 1 })}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      onError={(e) => {
                        const fallback = normalizeProductImageUrl(undefined, product.id + index + 100, imageContext);
                        (e.currentTarget as HTMLImageElement).src = fallback;
                      }}
                      className="w-full h-full object-cover"
                    />
                    </button>
                    <p className="text-xs text-center text-muted-foreground">View {index + 1}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Product Gallery</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">See the product from more angles</h2>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => setIsLightboxOpen(true)}>
                  Open gallery
                </Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                UrugoBuy product pages are designed to give shoppers more than a single image. You can browse the gallery,
                zoom into the main photo, compare views, and review the product details before adding it to cart.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {productDetailCards.slice(0, 2).map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Details */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Complete product details</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Delivery guidance included</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Reviews and questions below</span>
            </div>
            {product.isFeatured && (
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground mb-4 w-max">
                <Star className="w-3 h-3 mr-1 fill-current" /> {t("product.featuredBadge")}
              </div>
            )}
            
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
              {product.name}
            </h1>
            
            <div className="flex items-center mb-6">
              <div className="flex items-center mr-4">
                <Star className="w-5 h-5 fill-accent text-accent" />
                <span className="ml-1.5 font-medium">{formatNumber(product.rating)} {t("product.rating")}</span>
              </div>
              <span className="text-muted-foreground text-sm">|</span>
              <span className="ml-4 text-muted-foreground text-sm">
                {isOutOfStock ? t("product.outOfStock") : t("product.inStock", { count: product.stockQuantity })}
              </span>
            </div>
            
            <div className="font-display text-3xl font-bold mb-8 text-primary">
              {formatCurrency(product.price)}
            </div>
            
            <div className="mb-8 space-y-4 border-b border-border pb-8">
              {detailSections.map((section) => (
                <section key={section.id} className="rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-xl font-semibold">{section.title}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {productDetailCards.map((item) => (
                <div key={item.title} className="rounded-3xl border border-border bg-muted/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/70">{item.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("product.size")}</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="standard">{t("product.sizeStandard")}</option>
                  <option value="large">{t("product.sizeLarge")}</option>
                  <option value="xl">{t("product.sizeXl")}</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("product.pack")}</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedPack}
                  onChange={(e) => setSelectedPack(e.target.value)}
                >
                  <option value="single">{t("product.packSingle")}</option>
                  <option value="double">{t("product.packDouble")}</option>
                  <option value="family">{t("product.packFamily")}</option>
                </select>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">{t("product.quantity")}</p>
              <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-9 w-9 rounded-full hover:bg-muted transition"
                  aria-label={t("product.decreaseQuantity")}
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(Math.max(1, variantStock), prev + 1))}
                  className="h-9 w-9 rounded-full hover:bg-muted transition"
                  aria-label={t("product.increaseQuantity")}
                  disabled={variantStock <= 0}
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              {t("product.variantStock", { count: variantStock })}
            </p>
            <div className="mb-8 rounded-3xl border border-border bg-muted/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t("intl.productDeliveryTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("intl.deliveryWindow", {
                      min: marketGuide.deliveryDays[0],
                      max: marketGuide.deliveryDays[1],
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                  {t(`intl.clearance.${marketGuide.clearanceLabel}`)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("intl.goodsValue")}</p>
                  <p className="mt-1 font-medium">{formatCurrency(Number(product.price) * quantity)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("intl.dutyEstimate")}</p>
                  <p className="mt-1 font-medium">{formatCurrency(landedEstimate.dutyEstimate)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("intl.estimatedLandedTotal")}</p>
                  <p className="mt-1 font-medium">{formatCurrency(landedEstimate.landedTotalEstimate)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {marketGuide.taxIncluded
                  ? t("intl.taxIncluded")
                  : t("intl.taxExcluded")}
              </p>
              {marketGuide.customsThreshold !== undefined && (
                <p className="mt-2 text-sm text-amber-700">
                  {t("intl.customsThreshold", {
                    amount: formatCurrency(marketGuide.customsThreshold),
                  })}
                </p>
              )}
            </div>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                {t("product.benefit1")}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                {t("product.benefit2")}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                {t("product.benefit3")}
              </div>
            </div>
            
            <Button onClick={handleAddToCart} size="lg" disabled={isOutOfStock} className="w-full h-14 rounded-full text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0">
              <ShoppingBag className="w-5 h-5 mr-2" />
              {isOutOfStock ? t("product.outOfStock") : t("product.addToCart")}
            </Button>
            <Button onClick={handleToggleWishlist} variant="outline" size="lg" className="w-full h-12 rounded-full mt-3">
              <Heart className={`w-5 h-5 mr-2 ${inWishlist ? "fill-current" : ""}`} />
              {inWishlist ? t("product.removeFromWishlist") : t("product.addToWishlist")}
            </Button>
            <Button onClick={toggleCompare} variant="outline" size="lg" className="w-full h-12 rounded-full mt-3">
              {inCompare ? t("product.removeFromCompare") : t("product.addToCompare")}
            </Button>
            <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={t("product.targetPrice")}
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
              />
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleWatchAlert}
                disabled={watchProductAlert.isPending}
              >
                {t("product.trackAlert")}
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
                  toast({ title: t("product.linkCopied") });
                }
              }}
            >
              {t("product.shareProduct")}
            </Button>
          </div>
        </div>
        <section className="mt-14 border-t border-border pt-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Product overview</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Everything a shopper should understand before checkout</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                This section pulls the most important product information into one place so visitors can review the product,
                compare options, and decide with more confidence. It is meant to feel closer to a full e-commerce detail page
                than a simple image-and-price layout.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {productSpecRows.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{row.label}</p>
                    <p className="mt-2 font-medium text-foreground">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Why this page is fuller</p>
              <h2 className="mt-2 font-display text-3xl font-bold">More detail, more context, less guesswork</h2>
              <div className="mt-5 space-y-4">
                {buyingHighlights.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-border bg-background p-4">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/70">Before you buy</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Quick things shoppers usually want to know</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "What you will see",
                  body: "This product page shows the gallery, key details, selected buying options, delivery guidance, reviews, and related items in one place.",
                },
                {
                  title: "How to compare it",
                  body: "Use the image gallery, price, rating, and pack information together instead of relying on the photo alone.",
                },
                {
                  title: "If you need help",
                  body: "Use the product questions area or the Contact page if anything about the listing, delivery, or support path is unclear.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background p-5">
                  <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {deliverySupportCards.map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-primary/70">{item.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-3xl font-bold mb-4">{t("product.customerReviews")}</h2>
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">{t("product.rating")}</p>
              <p className="font-display text-3xl font-bold">{reviews.length > 0 ? formatNumber(reviewAverage) : "0.0"}/5</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">{t("product.verifiedPurchase")}</p>
              <p className="font-display text-3xl font-bold">{verifiedReviewCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Photo / video reviews</p>
              <p className="font-display text-3xl font-bold">{mediaReviewCount}</p>
            </div>
          </div>
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
              placeholder={user ? t("product.writeReview") : t("product.loginToReview")}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={!user}
              required
            />
            <p className="md:col-span-3 text-xs text-muted-foreground">
              Share what arrived, how fresh it was, and whether delivery matched expectations.
            </p>
            <Input
              placeholder={t("product.photoUrl")}
              value={reviewPhotoUrl}
              onChange={(e) => setReviewPhotoUrl(e.target.value)}
              disabled={!user}
            />
            <Input
              placeholder={t("product.videoUrl")}
              value={reviewVideoUrl}
              onChange={(e) => setReviewVideoUrl(e.target.value)}
              disabled={!user}
            />
            <Button type="submit" disabled={!user || createReview.isPending}>{t("product.submit")}</Button>
          </form>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">{t("product.noReviews")}</p>
            ) : (
              reviews.map((review: { id: number; userEmail: string; rating: number; comment: string; photoUrl?: string | null; videoUrl?: string | null; verifiedPurchase?: boolean }) => (
                <div key={review.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{maskEmail(review.userEmail)}</p>
                    {review.verifiedPurchase ? (
                      <span className="text-xs rounded-full bg-muted px-2 py-1">{t("product.verifiedPurchase")}</span>
                    ) : (
                      <span className="text-xs rounded-full bg-muted px-2 py-1">{t("product.unverifiedPurchase")}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t("product.rating")}: {formatNumber(review.rating)}/5</p>
                  <p className="mt-2">{review.comment}</p>
                  {review.photoUrl && (
                    <img src={review.photoUrl} alt={t("product.reviewUpload")} className="mt-3 h-24 w-24 rounded-md object-cover border border-border" />
                  )}
                  {review.videoUrl && (
                    <video src={review.videoUrl} controls className="mt-3 h-32 w-56 rounded-md border border-border bg-black" />
                  )}
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => handleHelpfulVote(review.id)}>
                    {t("product.helpful", { count: helpfulVotes[review.id] || 0 })}
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-3xl font-bold mb-2">{t("product.conversationTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("product.conversationBody")}</p>
          <form onSubmit={submitQuestion} className="flex gap-2 mb-6">
            <Input
              placeholder={t("product.askPlaceholder")}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
            <Button type="submit">{t("product.ask")}</Button>
          </form>
          <div className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-muted-foreground">{t("product.noMessages")}</p>
            ) : (
              questions.map((item) => (
                <div key={item.id} className="border border-border rounded-xl p-4">
                  <div className="rounded-2xl bg-muted/50 px-4 py-3">
                    <p className="font-medium mb-1">{t("product.customerLabel")}</p>
                    <p>{item.question}</p>
                  </div>
                  {item.answer ? (
                    <div className="mt-3 rounded-2xl bg-primary/10 px-4 py-3 text-foreground">
                      <p className="font-medium mb-1">{t("product.storeReply")}</p>
                      <p>{item.answer}</p>
                      <p className="text-xs mt-2 text-muted-foreground">
                        {item.answeredAt ? t("product.answeredOn", { date: formatDateTime(item.answeredAt) }) : t("product.answered")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">{t("product.awaitingAnswer")}</p>
                  )}
                  {user?.role === "admin" && !item.answer && (
                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder={t("product.writeAnswer")}
                        value={answerDrafts[item.id] || ""}
                        onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <Button type="button" onClick={() => answerQuestion(item.id)}>{t("product.reply")}</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
        {compared.length >= 2 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-bold mb-4">{t("product.compareTitle")}</h2>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left p-3">{t("product.tableProduct")}</th>
                    <th className="text-left p-3">{t("product.tablePrice")}</th>
                    <th className="text-left p-3">{t("product.tableRating")}</th>
                    <th className="text-left p-3">{t("product.tableStock")}</th>
                  </tr>
                </thead>
                <tbody>
                  {compared.map((row: { id: number; name: string; price: string; rating: string; stockQuantity: number }) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{formatCurrency(row.price)}</td>
                      <td className="p-3">{formatNumber(row.rating)}</td>
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
            <h2 className="font-display text-3xl font-bold mb-6">{t("product.frequentlyBought")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((item: any) => (
                <div key={`bundle-${item.id}`} className="space-y-2">
                  <ProductCard product={item} />
                  <p className="text-xs text-muted-foreground">
                    {t("product.boughtTogether", { count: item.pairCount })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {recommended.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-3xl font-bold mb-6">{t("product.youMayAlsoLike")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((rec: any) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </section>
        )}
      </div>
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 px-4 py-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between text-white">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Product Gallery</p>
                <h2 className="font-display text-2xl font-bold">{product.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="rounded-full border border-white/20 bg-white/10 p-3 hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              <img
                src={imageSrc}
                alt={product.name}
                className="h-full w-full object-contain"
              />
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label={t("product.previousImage")}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label={t("product.nextImage")}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={`${product.id}-lightbox-thumb-${index}`}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={`overflow-hidden rounded-2xl border-2 ${index === activeImageIndex ? "border-primary" : "border-white/10"}`}
                >
                  <img src={image} alt={`${product.name} detail ${index + 1}`} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
