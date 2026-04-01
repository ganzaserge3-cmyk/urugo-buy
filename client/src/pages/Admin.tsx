import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/images";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { formatOrderMoney } from "@/lib/order-pricing";

type AdminProduct = {
  id: number;
  name: string;
  nameTranslations?: string | null;
  description: string;
  descriptionTranslations?: string | null;
  price: string;
  imageUrl: string;
  imageGallery: string[];
  categoryId: number | null;
  vendorId?: number | null;
  rating?: string;
  stockQuantity: number;
  isFeatured: boolean | null;
};

type AdminOrder = {
  id: number;
  orderNumber: string;
  customerEmail: string;
  customerPhone?: string | null;
  total: string;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  marketCountry?: string;
  currencyCode?: string;
  currencySymbol?: string;
  exchangeRate?: string | number;
};

type AdminOrderDetail = {
  order: {
    id: number;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    shippingAddress: string;
    city: string;
    country: string;
    subtotal: string;
    shippingFee: string;
    tax: string;
    total: string;
    status: string;
    paymentMethod?: string;
    paymentStatus?: string;
    deliverySlot?: string;
    shippingService?: string;
    shipmentCarrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    shippingNote?: string | null;
    shippedAt?: string | Date | null;
    deliveredAt?: string | Date | null;
    createdAt: string | Date;
    marketCountry?: string;
    currencyCode?: string;
    currencySymbol?: string;
    exchangeRate?: string | number;
  };
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
};

type AdminResumePayment = {
  checkoutUrl: string;
  sessionToken: string;
  expiresAt: string;
  provider: "demo" | "paypal";
  method: "card" | "paypal" | "momo";
};

type Analytics = {
  totalOrders: number;
  revenue: number;
  totalProducts: number;
  lowStockProducts: number;
  topProducts: Array<{ productId: number; productName: string; soldQty: number }>;
};

type AdvancedAnalytics = {
  ordersCount: number;
  revenue: number;
  avgOrderValue: number;
  daily: Array<{ day: string; revenue: number; orders: number }>;
};

type Vendor = {
  id: number;
  name: string;
  slug: string;
  contactEmail: string;
};

type Promotion = {
  id: number;
  name: string;
  type: string;
  value: string;
  audience: string;
  active: boolean;
};

type GiftCard = {
  code: string;
  balance: string;
  active: boolean;
};

type AdminCategory = {
  id: number;
  name: string;
  nameTranslations?: string | null;
  slug: string;
  imageUrl?: string | null;
};

type AdminContentPage = {
  id: number;
  slug: string;
  title: string;
  titleTranslations?: string | null;
  description: string;
  descriptionTranslations?: string | null;
  body: string;
  bodyTranslations?: string | null;
  seoJsonLd?: string | null;
  published: boolean;
};

type AdminBlogPost = {
  id: number;
  slug: string;
  title: string;
  titleTranslations?: string | null;
  excerpt: string;
  excerptTranslations?: string | null;
  body: string;
  bodyTranslations?: string | null;
  coverImageUrl?: string | null;
  published: boolean;
};

type AdminQuestion = {
  id: number;
  productId: number;
  productName: string;
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
};

type AdminCustomer = {
  email: string;
  name: string;
  totalOrders: number;
  totalSpend: number;
  openReturns: number;
  supportTickets: number;
  savedAddresses: number;
  lastOrderAt: string | null;
  lastSupportAt: string | null;
  lastSeenAt: string | null;
  lastOrderStatus: string | null;
  lastSupportTopic: string | null;
  registered: boolean;
  accountCreatedAt: string | null;
};

type AdminReview = {
  id: number;
  productId: number;
  productName: string;
  userEmail: string;
  rating: string;
  comment: string;
  photoUrl?: string | null;
  videoUrl?: string | null;
  verifiedPurchase?: boolean;
  createdAt: string;
};

type AdminSupportTicket = {
  id: number;
  userEmail?: string | null;
  contactEmail?: string | null;
  topic: string;
  message: string;
  status: string;
  createdAt: string;
};

function parseTranslationMap(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function buildTranslationPayload(values: Record<string, string>): Record<string, string> | undefined {
  const entries = Object.entries(values)
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([, value]) => value.length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export default function Admin() {
  const { t, formatCurrency, formatDateTime, formatNumber } = useI18n();
  useSeo(t("admin.metaTitle"), t("admin.metaDescription"), { canonicalPath: "/admin", robots: "noindex,nofollow" });
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [contentPages, setContentPages] = useState<AdminContentPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>([]);
  const [forecastRows, setForecastRows] = useState<Array<{ productId: number; productName: string; stockQuantity: number; avgDailySales: number; forecastDaysUntilOut: number | null }>>([]);
  const [returnRows, setReturnRows] = useState<Array<{ id: number; orderId: number; status: string }>>([]);
  const [shipmentForm, setShipmentForm] = useState({
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
    shippingNote: "",
    markStatus: "shipped",
  });
  const [returnUpdateDrafts, setReturnUpdateDrafts] = useState<Record<number, { status: string; note: string; refundAmount: string }>>({});
  const [abandonedRows, setAbandonedRows] = useState<Array<{ email?: string; itemCount: number; createdAt: string }>>([]);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryChannel, setRecoveryChannel] = useState<"email" | "sms">("email");
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [supportInbox, setSupportInbox] = useState<AdminSupportTicket[]>([]);
  const [questionReplies, setQuestionReplies] = useState<Record<number, string>>({});
  const [pricingRules, setPricingRules] = useState<Record<string, { threshold: number; markupPercent?: number; markdownPercent?: number }> | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    nameRw: "",
    description: "",
    descriptionRw: "",
    price: "",
    imageUrl: "",
    imageGallery: "",
    categoryId: "1",
    vendorId: "",
    stockQuantity: "0",
    isFeatured: false,
  });
  const [vendorForm, setVendorForm] = useState({ name: "", slug: "", contactEmail: "" });
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    type: "percent",
    value: "",
    startsAt: "",
    endsAt: "",
    audience: "all",
    active: true,
  });
  const [orderStatus, setOrderStatus] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState({
    status: "",
    paymentStatus: "",
    dateFrom: "",
    dateTo: "",
  });
  const [giftCardForm, setGiftCardForm] = useState({ code: "", balance: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", nameRw: "", slug: "", imageUrl: "" });
  const [contentPageForm, setContentPageForm] = useState({
    slug: "",
    title: "",
    titleRw: "",
    description: "",
    descriptionRw: "",
    body: "",
    bodyRw: "",
    seoJsonLd: "",
    published: true,
  });
  const [blogPostForm, setBlogPostForm] = useState({
    slug: "",
    title: "",
    titleRw: "",
    excerpt: "",
    excerptRw: "",
    body: "",
    bodyRw: "",
    coverImageUrl: "",
    published: true,
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    nameRw: "",
    description: "",
    descriptionRw: "",
    price: "",
    imageUrl: "",
    imageGallery: "",
    categoryId: "1",
    vendorId: "",
    stockQuantity: "0",
    isFeatured: false,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [selectedOrderReturns, setSelectedOrderReturns] = useState<Array<{ id: number; status: string; reason?: string; resolution?: string | null; refundAmount?: string | null; refundCurrency?: string | null; adminNote?: string | null; timeline?: Array<{ id: number; status: string; note?: string | null; createdAt: string }> }>>([]);
  const [selectedOrderNotifications, setSelectedOrderNotifications] = useState<{ emailMessage: string; smsMessage: string; logCount?: number } | null>(null);
  const [selectedOrderResumePayment, setSelectedOrderResumePayment] = useState<AdminResumePayment | null>(null);
  const [isOrderDetailLoading, setIsOrderDetailLoading] = useState(false);
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingContentPageId, setEditingContentPageId] = useState<number | null>(null);
  const [editingBlogPostId, setEditingBlogPostId] = useState<number | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: "", nameRw: "", slug: "", imageUrl: "" });
  const [editContentPageForm, setEditContentPageForm] = useState({
    slug: "",
    title: "",
    titleRw: "",
    description: "",
    descriptionRw: "",
    body: "",
    bodyRw: "",
    seoJsonLd: "",
    published: true,
  });
  const [editBlogPostForm, setEditBlogPostForm] = useState({
    slug: "",
    title: "",
    titleRw: "",
    excerpt: "",
    excerptRw: "",
    body: "",
    bodyRw: "",
    coverImageUrl: "",
    published: true,
  });

  const loadAll = async () => {
    const orderParams = new URLSearchParams();
    if (orderSearch) orderParams.set("search", orderSearch);
    if (orderFilter.status) orderParams.set("status", orderFilter.status);
    if (orderFilter.paymentStatus) orderParams.set("paymentStatus", orderFilter.paymentStatus);
    if (orderFilter.dateFrom) orderParams.set("dateFrom", orderFilter.dateFrom);
    if (orderFilter.dateTo) orderParams.set("dateTo", orderFilter.dateTo);

    const productParams = new URLSearchParams();
    if (productSearch) productParams.set("search", productSearch);
    const customerParams = new URLSearchParams();
    if (customerSearch) customerParams.set("search", customerSearch);

    const [p, o, customersRes, reviewsRes, supportRes, a, adv, v, promo, forecast, returns, abandoned, gc, pricing, qa, c, cp, bp] = await Promise.all([
      authFetch(`/api/admin/products${productParams.toString() ? `?${productParams.toString()}` : ""}`),
      authFetch(`/api/admin/orders${orderParams.toString() ? `?${orderParams.toString()}` : ""}`),
      authFetch(`/api/admin/customers${customerParams.toString() ? `?${customerParams.toString()}` : ""}`),
      authFetch("/api/admin/reviews"),
      authFetch("/api/admin/support-tickets"),
      authFetch("/api/admin/analytics"),
      authFetch("/api/admin/analytics/advanced"),
      authFetch("/api/admin/vendors"),
      authFetch("/api/admin/promotions"),
      authFetch("/api/admin/inventory/forecast"),
      authFetch("/api/admin/returns"),
      authFetch("/api/admin/abandoned-carts"),
      authFetch("/api/admin/gift-cards"),
      authFetch("/api/admin/pricing/rules"),
      authFetch("/api/admin/questions"),
      authFetch("/api/admin/categories"),
      authFetch("/api/admin/content-pages"),
      authFetch("/api/admin/blog-posts"),
    ]);
    if (p.ok) setProducts(await p.json());
    if (o.ok) setOrders(await o.json());
    if (customersRes.ok) setCustomers(await customersRes.json());
    if (reviewsRes.ok) setReviews(await reviewsRes.json());
    if (supportRes.ok) setSupportInbox(await supportRes.json());
    if (a.ok) setAnalytics(await a.json());
    if (adv.ok) setAdvancedAnalytics(await adv.json());
    if (v.ok) setVendors(await v.json());
    if (promo.ok) setPromotions(await promo.json());
    if (forecast.ok) setForecastRows(await forecast.json());
    if (returns.ok) setReturnRows(await returns.json());
    if (abandoned.ok) setAbandonedRows(await abandoned.json());
    if (gc.ok) setGiftCards(await gc.json());
    if (pricing.ok) setPricingRules(await pricing.json());
    if (qa.ok) setQuestions(await qa.json());
    if (c.ok) setCategories(await c.json());
    if (cp.ok) setContentPages(await cp.json());
    if (bp.ok) setBlogPosts(await bp.json());
  };

  useEffect(() => {
    if (token) {
      loadAll().catch(() => undefined);
    }
  }, [token, productSearch, orderSearch, customerSearch, orderFilter.status, orderFilter.paymentStatus, orderFilter.dateFrom, orderFilter.dateTo]);

  if (!user || !token) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-xl mx-auto border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Admin Access Required</h1>
          <h1 className="font-display text-3xl font-bold mb-3">{t("admin.accessRequired")}</h1>
          <p className="text-muted-foreground mb-6">{t("admin.accessRequiredBody")}</p>
          <Button asChild className="rounded-full">
            <Link href="/login">{t("admin.goToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-xl mx-auto border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">{t("admin.forbidden")}</h1>
          <p className="text-muted-foreground">{t("admin.forbiddenBody")}</p>
        </div>
      </div>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrl = normalizeProductImageUrl(productForm.imageUrl);
    const imageGallery = productForm.imageGallery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url, index) => normalizeProductImageUrl(url, index + 1));

    const res = await authFetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productForm.name,
        nameTranslations: buildTranslationPayload({ rw: productForm.nameRw }),
        description: productForm.description,
        descriptionTranslations: buildTranslationPayload({ rw: productForm.descriptionRw }),
        price: Number(productForm.price),
        imageUrl,
        imageGallery,
        categoryId: Number(productForm.categoryId),
        vendorId: productForm.vendorId ? Number(productForm.vendorId) : undefined,
        stockQuantity: Number(productForm.stockQuantity),
        isFeatured: productForm.isFeatured,
      }),
    });
    if (res.ok) {
      setProductForm({
        name: "",
        nameRw: "",
        description: "",
        descriptionRw: "",
        price: "",
        imageUrl: "",
        imageGallery: "",
        categoryId: "1",
        vendorId: "",
        stockQuantity: "0",
        isFeatured: false,
      });
      await loadAll();
    }
  };

  const createVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendorForm),
    });
    if (res.ok) {
      setVendorForm({ name: "", slug: "", contactEmail: "" });
      await loadAll();
    }
  };

  const createPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...promotionForm,
        value: Number(promotionForm.value),
        startsAt: new Date(promotionForm.startsAt || Date.now()).toISOString(),
        endsAt: new Date(promotionForm.endsAt || Date.now() + 86400000).toISOString(),
      }),
    });
    if (res.ok) {
      setPromotionForm({ name: "", type: "percent", value: "", startsAt: "", endsAt: "", audience: "all", active: true });
      await loadAll();
    }
  };

  const handleStatusUpdate = async (orderId: number) => {
    const status = orderStatus[orderId];
    if (!status) return;
    const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadAll();
  };

  const handleDeleteProduct = async (id: number) => {
    const res = await authFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingProductId === id) setEditingProductId(null);
      await loadAll();
      toast({ title: "Product deleted" });
    }
  };

  const startEditProduct = (product: AdminProduct) => {
    const nameTranslations = parseTranslationMap(product.nameTranslations);
    const descriptionTranslations = parseTranslationMap(product.descriptionTranslations);
    setEditingProductId(product.id);
    setEditProductForm({
      name: product.name,
      nameRw: nameTranslations.rw || "",
      description: product.description || "",
      descriptionRw: descriptionTranslations.rw || "",
      price: String(product.price),
      imageUrl: product.imageUrl || "",
      imageGallery: Array.isArray(product.imageGallery) ? product.imageGallery.join(", ") : "",
      categoryId: String(product.categoryId ?? 1),
      vendorId: product.vendorId ? String(product.vendorId) : "",
      stockQuantity: String(product.stockQuantity),
      isFeatured: Boolean(product.isFeatured),
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditProductForm({
      name: "",
      nameRw: "",
      description: "",
      descriptionRw: "",
      price: "",
      imageUrl: "",
      imageGallery: "",
      categoryId: "1",
      vendorId: "",
      stockQuantity: "0",
      isFeatured: false,
    });
  };

  const startEditCategory = (category: AdminCategory) => {
    const translations = parseTranslationMap(category.nameTranslations);
    setEditingCategoryId(category.id);
    setEditCategoryForm({
      name: category.name,
      nameRw: translations.rw || "",
      slug: category.slug,
      imageUrl: category.imageUrl || "",
    });
  };

  const saveEditCategory = async (id: number) => {
    const imageUrl = editCategoryForm.imageUrl ? normalizeProductImageUrl(editCategoryForm.imageUrl) : "";
    const res = await authFetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editCategoryForm.name,
        nameTranslations: buildTranslationPayload({ rw: editCategoryForm.nameRw }),
        slug: editCategoryForm.slug,
        imageUrl,
      }),
    });
    if (!res.ok) return;
    setEditingCategoryId(null);
    setEditCategoryForm({ name: "", nameRw: "", slug: "", imageUrl: "" });
    await loadAll();
  };

  const startEditContentPage = (page: AdminContentPage) => {
    const titleTranslations = parseTranslationMap(page.titleTranslations);
    const descriptionTranslations = parseTranslationMap(page.descriptionTranslations);
    const bodyTranslations = parseTranslationMap(page.bodyTranslations);
    setEditingContentPageId(page.id);
    setEditContentPageForm({
      slug: page.slug,
      title: page.title,
      titleRw: titleTranslations.rw || "",
      description: page.description,
      descriptionRw: descriptionTranslations.rw || "",
      body: page.body,
      bodyRw: bodyTranslations.rw || "",
      seoJsonLd: page.seoJsonLd || "",
      published: page.published,
    });
  };

  const saveEditContentPage = async (id: number) => {
    const res = await authFetch(`/api/admin/content-pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: editContentPageForm.slug,
        title: editContentPageForm.title,
        titleTranslations: buildTranslationPayload({ rw: editContentPageForm.titleRw }),
        description: editContentPageForm.description,
        descriptionTranslations: buildTranslationPayload({ rw: editContentPageForm.descriptionRw }),
        body: editContentPageForm.body,
        bodyTranslations: buildTranslationPayload({ rw: editContentPageForm.bodyRw }),
        seoJsonLd: editContentPageForm.seoJsonLd,
        published: editContentPageForm.published,
      }),
    });
    if (!res.ok) return;
    setEditingContentPageId(null);
    setEditContentPageForm({
      slug: "",
      title: "",
      titleRw: "",
      description: "",
      descriptionRw: "",
      body: "",
      bodyRw: "",
      seoJsonLd: "",
      published: true,
    });
    await loadAll();
  };

  const startEditBlogPost = (post: AdminBlogPost) => {
    const titleTranslations = parseTranslationMap(post.titleTranslations);
    const excerptTranslations = parseTranslationMap(post.excerptTranslations);
    const bodyTranslations = parseTranslationMap(post.bodyTranslations);
    setEditingBlogPostId(post.id);
    setEditBlogPostForm({
      slug: post.slug,
      title: post.title,
      titleRw: titleTranslations.rw || "",
      excerpt: post.excerpt,
      excerptRw: excerptTranslations.rw || "",
      body: post.body,
      bodyRw: bodyTranslations.rw || "",
      coverImageUrl: post.coverImageUrl || "",
      published: post.published,
    });
  };

  const saveEditBlogPost = async (id: number) => {
    const coverImageUrl = editBlogPostForm.coverImageUrl ? normalizeProductImageUrl(editBlogPostForm.coverImageUrl) : "";
    const res = await authFetch(`/api/admin/blog-posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: editBlogPostForm.slug,
        title: editBlogPostForm.title,
        titleTranslations: buildTranslationPayload({ rw: editBlogPostForm.titleRw }),
        excerpt: editBlogPostForm.excerpt,
        excerptTranslations: buildTranslationPayload({ rw: editBlogPostForm.excerptRw }),
        body: editBlogPostForm.body,
        bodyTranslations: buildTranslationPayload({ rw: editBlogPostForm.bodyRw }),
        coverImageUrl,
        published: editBlogPostForm.published,
      }),
    });
    if (!res.ok) return;
    setEditingBlogPostId(null);
    setEditBlogPostForm({
      slug: "",
      title: "",
      titleRw: "",
      excerpt: "",
      excerptRw: "",
      body: "",
      bodyRw: "",
      coverImageUrl: "",
      published: true,
    });
    await loadAll();
  };

  const saveEditProduct = async (id: number) => {
    const imageUrl = normalizeProductImageUrl(editProductForm.imageUrl);
    const imageGallery = editProductForm.imageGallery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url, index) => normalizeProductImageUrl(url, index + 1));

    const res = await authFetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editProductForm.name,
        nameTranslations: buildTranslationPayload({ rw: editProductForm.nameRw }),
        description: editProductForm.description,
        descriptionTranslations: buildTranslationPayload({ rw: editProductForm.descriptionRw }),
        price: Number(editProductForm.price),
        imageUrl,
        imageGallery,
        categoryId: Number(editProductForm.categoryId),
        vendorId: editProductForm.vendorId ? Number(editProductForm.vendorId) : undefined,
        stockQuantity: Number(editProductForm.stockQuantity),
        isFeatured: editProductForm.isFeatured,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Failed to update product" }));
      toast({ variant: "destructive", title: "Update failed", description: payload.message });
      return;
    }

    await loadAll();
    cancelEditProduct();
    toast({ title: "Product updated" });
  };

  const handleRestockLow = async () => {
    const res = await authFetch("/api/admin/products/restock-low", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold: 5, quantity: 20 }),
    });
    if (res.ok) await loadAll();
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: giftCardForm.code,
        balance: Number(giftCardForm.balance),
        active: true,
      }),
    });
    if (res.ok) {
      setGiftCardForm({ code: "", balance: "" });
      await loadAll();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrl = categoryForm.imageUrl ? normalizeProductImageUrl(categoryForm.imageUrl) : "";
    const res = await authFetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryForm.name,
        nameTranslations: buildTranslationPayload({ rw: categoryForm.nameRw }),
        slug: categoryForm.slug,
        imageUrl,
      }),
    });
    if (!res.ok) return;
    setCategoryForm({ name: "", nameRw: "", slug: "", imageUrl: "" });
    await loadAll();
  };

  const handleCreateContentPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/admin/content-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: contentPageForm.slug,
        title: contentPageForm.title,
        titleTranslations: buildTranslationPayload({ rw: contentPageForm.titleRw }),
        description: contentPageForm.description,
        descriptionTranslations: buildTranslationPayload({ rw: contentPageForm.descriptionRw }),
        body: contentPageForm.body,
        bodyTranslations: buildTranslationPayload({ rw: contentPageForm.bodyRw }),
        seoJsonLd: contentPageForm.seoJsonLd,
        published: contentPageForm.published,
      }),
    });
    if (!res.ok) return;
    setContentPageForm({
      slug: "",
      title: "",
      titleRw: "",
      description: "",
      descriptionRw: "",
      body: "",
      bodyRw: "",
      seoJsonLd: "",
      published: true,
    });
    await loadAll();
  };

  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const coverImageUrl = blogPostForm.coverImageUrl ? normalizeProductImageUrl(blogPostForm.coverImageUrl) : "";
    const res = await authFetch("/api/admin/blog-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: blogPostForm.slug,
        title: blogPostForm.title,
        titleTranslations: buildTranslationPayload({ rw: blogPostForm.titleRw }),
        excerpt: blogPostForm.excerpt,
        excerptTranslations: buildTranslationPayload({ rw: blogPostForm.excerptRw }),
        body: blogPostForm.body,
        bodyTranslations: buildTranslationPayload({ rw: blogPostForm.bodyRw }),
        coverImageUrl,
        published: blogPostForm.published,
      }),
    });
    if (!res.ok) return;
    setBlogPostForm({
      slug: "",
      title: "",
      titleRw: "",
      excerpt: "",
      excerptRw: "",
      body: "",
      bodyRw: "",
      coverImageUrl: "",
      published: true,
    });
    await loadAll();
  };

  const triggerRecoveryJourney = async () => {
    const res = await authFetch("/api/admin/abandoned-carts/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: recoveryChannel,
        email: recoveryEmail.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Could not start recovery journey." }));
      toast({ variant: "destructive", title: "Recovery failed", description: payload.message });
      return;
    }
    const payload = await res.json().catch(() => null) as { targeted?: string; sent?: number; journey?: string } | null;
    toast({
      title: "Recovery started",
      description: payload
        ? `${payload.sent ?? 0} message(s) queued for ${payload.targeted ?? "recent abandoners"} via ${payload.journey ?? recoveryChannel}.`
        : "Recovery journey has been queued.",
    });
    await loadAll();
  };

  const handleQuestionReply = async (questionId: number) => {
    const answer = questionReplies[questionId]?.trim();
    if (!answer) return;
    const res = await authFetch(`/api/admin/questions/${questionId}/answer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) return;
    setQuestionReplies((prev) => ({ ...prev, [questionId]: "" }));
    await loadAll();
  };

  const handleDeleteReview = async (reviewId: number) => {
    const res = await authFetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Delete failed", description: "Could not remove the review." });
      return;
    }
    toast({ title: "Review removed" });
    await loadAll();
  };

  const handleSupportStatusUpdate = async (ticketId: number, status: "open" | "in_progress" | "resolved") => {
    const res = await authFetch(`/api/admin/support-tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Support update failed", description: "Could not update ticket status." });
      return;
    }
    toast({ title: "Support ticket updated" });
    await loadAll();
  };

  const handleViewOrder = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailLoading(true);
    try {
      const [detailRes, returnsRes, notificationsRes, resumePaymentRes] = await Promise.all([
        authFetch(`/api/orders/${orderId}`),
        authFetch(`/api/orders/${orderId}/returns`),
        authFetch(`/api/notifications/${orderId}`),
        authFetch(`/api/payments/${orderId}/resume`),
      ]);

      const detailPayload = detailRes.ok ? await detailRes.json() : null;
      const returnsPayload = returnsRes.ok ? await returnsRes.json() : [];
      const notificationsPayload = notificationsRes.ok ? await notificationsRes.json() : null;
      const resumePaymentPayload = resumePaymentRes.ok ? await resumePaymentRes.json() : null;

      setSelectedOrderDetail(detailPayload);
      setSelectedOrderReturns(Array.isArray(returnsPayload) ? returnsPayload : []);
      setSelectedOrderNotifications(notificationsPayload);
      setSelectedOrderResumePayment(resumePaymentPayload);
      setShipmentForm({
        carrier: detailPayload?.order?.shipmentCarrier || "",
        trackingNumber: detailPayload?.order?.trackingNumber || "",
        trackingUrl: detailPayload?.order?.trackingUrl || "",
        shippingNote: detailPayload?.order?.shippingNote || "",
        markStatus: detailPayload?.order?.status || "shipped",
      });
    } catch {
      setSelectedOrderDetail(null);
      setSelectedOrderReturns([]);
      setSelectedOrderNotifications(null);
      setSelectedOrderResumePayment(null);
    } finally {
      setIsOrderDetailLoading(false);
    }
  };

  const handleCopyResumePaymentLink = async () => {
    if (!selectedOrderResumePayment?.checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(selectedOrderResumePayment.checkoutUrl);
      toast({ title: "Payment link copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Could not copy the payment link." });
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!selectedOrderId) return;
    setIsGeneratingPaymentLink(true);
    try {
      const res = await authFetch(`/api/payments/${selectedOrderId}/restart`, { method: "POST" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Failed to generate payment link" }));
        toast({ variant: "destructive", title: "Payment link failed", description: payload.message });
        return;
      }

      const payload = (await res.json()) as AdminResumePayment;
      setSelectedOrderResumePayment(payload);
      toast({ title: "Payment link ready" });
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  const handleSaveShipment = async () => {
    if (!selectedOrderId) return;
    const res = await authFetch(`/api/admin/orders/${selectedOrderId}/shipment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...shipmentForm,
        markStatus: shipmentForm.markStatus,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Shipment update failed" }));
      toast({ variant: "destructive", title: "Shipment update failed", description: payload.message });
      return;
    }
    toast({ title: "Shipment tracking saved" });
    await handleViewOrder(selectedOrderId);
    await loadAll();
  };

  const handleUpdateReturn = async (returnId: number) => {
    const draft = returnUpdateDrafts[returnId];
    if (!draft?.status) return;
    const res = await authFetch(`/api/admin/returns/${returnId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: draft.status,
        note: draft.note || undefined,
        adminNote: draft.note || undefined,
        refundAmount: draft.refundAmount ? Number(draft.refundAmount) : undefined,
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: "Return update failed" }));
      toast({ variant: "destructive", title: "Return update failed", description: payload.message });
      return;
    }
    toast({ title: "Return updated" });
    if (selectedOrderId) {
      await handleViewOrder(selectedOrderId);
    }
    await loadAll();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="rounded-full" onClick={() => loadAll().catch(() => undefined)}>
              {t("admin.refresh")}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={handleRestockLow}>
              {t("admin.restockLow")}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={triggerRecoveryJourney}>
              {t("admin.recoverCarts")}
            </Button>
          </div>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-2xl font-bold">{analytics?.totalOrders ?? 0}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(analytics?.revenue ?? 0)}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Products</p>
            <p className="text-2xl font-bold">{analytics?.totalProducts ?? 0}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold">{analytics?.lowStockProducts ?? 0}</p>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <h2 className="font-display text-2xl font-semibold mb-4">Advanced Analytics</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">AOV</p>
              <p className="text-xl font-bold">{formatCurrency(advancedAnalytics?.avgOrderValue ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-xl font-bold">{advancedAnalytics?.ordersCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(advancedAnalytics?.revenue ?? 0)}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {advancedAnalytics?.daily?.map((row) => (
              <div key={row.day} className="border border-border rounded-lg p-2 flex items-center justify-between">
                <span>{row.day}</span>
                <span>{formatCurrency(row.revenue)} / {row.orders} orders</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateProduct} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Add Product</h2>
            <Input placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input placeholder="Kinyarwanda name" value={productForm.nameRw} onChange={(e) => setProductForm((p) => ({ ...p, nameRw: e.target.value }))} />
            <Input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} required />
            <Input placeholder="Kinyarwanda description" value={productForm.descriptionRw} onChange={(e) => setProductForm((p) => ({ ...p, descriptionRw: e.target.value }))} />
            <Input type="number" step="0.01" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} required />
            <Input placeholder="Image URL" value={productForm.imageUrl} onChange={(e) => setProductForm((p) => ({ ...p, imageUrl: e.target.value }))} required />
            <Input placeholder="Gallery URLs (comma-separated)" value={productForm.imageGallery} onChange={(e) => setProductForm((p) => ({ ...p, imageGallery: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={1} placeholder="Category ID" value={productForm.categoryId} onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))} required />
              <Input type="number" min={0} placeholder="Stock" value={productForm.stockQuantity} onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))} required />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
              value={productForm.vendorId}
              onChange={(e) => setProductForm((p) => ({ ...p, vendorId: e.target.value }))}
            >
              <option value="">No vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={productForm.isFeatured} onChange={(e) => setProductForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
              Featured product
            </label>
            <Button type="submit" className="rounded-full">Create Product</Button>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-4">Top Products</h2>
            <div className="space-y-3">
              {analytics?.topProducts?.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm border-b border-border pb-2">
                  <span>{item.productName}</span>
                  <span className="font-medium">{item.soldQty} sold</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Active Promotions</p>
            <p className="text-2xl font-bold">{promotions.filter((item) => item.active).length}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Open Returns</p>
            <p className="text-2xl font-bold">{returnRows.length}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Open Questions</p>
            <p className="text-2xl font-bold">{questions.filter((item) => !item.answer).length}</p>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Customer Management</h2>
              <p className="text-sm text-muted-foreground">See who is buying, who needs support, and which customers are most valuable.</p>
            </div>
            <Input
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Known customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Registered accounts</p>
              <p className="text-2xl font-bold">{customers.filter((customer) => customer.registered).length}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Need support follow-up</p>
              <p className="text-2xl font-bold">{customers.filter((customer) => customer.supportTickets > 0 || customer.openReturns > 0).length}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Repeat buyers</p>
              <p className="text-2xl font-bold">{customers.filter((customer) => customer.totalOrders >= 2).length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {customers.slice(0, 12).map((customer) => (
              <div key={customer.email} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{customer.name || "Guest customer"}</p>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{customer.registered ? "Registered" : "Guest / order-only"}</span>
                      {customer.lastOrderStatus && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs capitalize">{customer.lastOrderStatus.replace("_", " ")}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border px-2 py-1">{customer.totalOrders} orders</span>
                      <span className="rounded-full border border-border px-2 py-1">{formatCurrency(customer.totalSpend)} spend</span>
                      <span className="rounded-full border border-border px-2 py-1">{customer.savedAddresses} addresses</span>
                      <span className="rounded-full border border-border px-2 py-1">{customer.supportTickets} support tickets</span>
                      <span className="rounded-full border border-border px-2 py-1">{customer.openReturns} open returns</span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm lg:min-w-[420px]">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground">Last activity</p>
                      <p className="font-medium">{customer.lastSeenAt ? formatDateTime(customer.lastSeenAt) : "No activity yet"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground">Last order</p>
                      <p className="font-medium">{customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "No orders yet"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground">Last support</p>
                      <p className="font-medium line-clamp-2">{customer.lastSupportTopic || "No support history"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-sm text-muted-foreground">No customers found for the current filter.</p>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateCategory} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Categories</h2>
            <Input placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <Input placeholder="Kinyarwanda name" value={categoryForm.nameRw} onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameRw: e.target.value }))} />
            <Input placeholder="Slug" value={categoryForm.slug} onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))} required />
            <Input placeholder="Image URL" value={categoryForm.imageUrl} onChange={(e) => setCategoryForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            <Button type="submit" className="rounded-full">Save Category</Button>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-1">
              {categories.map((category) => (
                <div key={category.id} className="border border-border rounded-lg p-2">
                  {editingCategoryId === category.id ? (
                    <div className="space-y-2">
                      <Input value={editCategoryForm.name} onChange={(e) => setEditCategoryForm((prev) => ({ ...prev, name: e.target.value }))} />
                      <Input value={editCategoryForm.nameRw} onChange={(e) => setEditCategoryForm((prev) => ({ ...prev, nameRw: e.target.value }))} placeholder="Kinyarwanda name" />
                      <Input value={editCategoryForm.slug} onChange={(e) => setEditCategoryForm((prev) => ({ ...prev, slug: e.target.value }))} />
                      <Input value={editCategoryForm.imageUrl} onChange={(e) => setEditCategoryForm((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="Image URL" />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveEditCategory(category.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-muted-foreground text-xs">{category.slug}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEditCategory(category)}>Edit</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>

          <form onSubmit={handleCreateContentPage} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Content Pages</h2>
            <Input placeholder="Slug" value={contentPageForm.slug} onChange={(e) => setContentPageForm((prev) => ({ ...prev, slug: e.target.value }))} required />
            <Input placeholder="Title" value={contentPageForm.title} onChange={(e) => setContentPageForm((prev) => ({ ...prev, title: e.target.value }))} required />
            <Input placeholder="Kinyarwanda title" value={contentPageForm.titleRw} onChange={(e) => setContentPageForm((prev) => ({ ...prev, titleRw: e.target.value }))} />
            <Input placeholder="Description" value={contentPageForm.description} onChange={(e) => setContentPageForm((prev) => ({ ...prev, description: e.target.value }))} required />
            <Input placeholder="Kinyarwanda description" value={contentPageForm.descriptionRw} onChange={(e) => setContentPageForm((prev) => ({ ...prev, descriptionRw: e.target.value }))} />
            <textarea className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" placeholder="Body" value={contentPageForm.body} onChange={(e) => setContentPageForm((prev) => ({ ...prev, body: e.target.value }))} required />
            <textarea className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" placeholder="Kinyarwanda body" value={contentPageForm.bodyRw} onChange={(e) => setContentPageForm((prev) => ({ ...prev, bodyRw: e.target.value }))} />
            <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" placeholder="SEO JSON-LD (optional)" value={contentPageForm.seoJsonLd} onChange={(e) => setContentPageForm((prev) => ({ ...prev, seoJsonLd: e.target.value }))} />
            <p className="text-xs text-muted-foreground">
              This field also supports landing-page config JSON like hero eyebrow, CTA labels/links, highlights, sections, and FAQ items.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={contentPageForm.published} onChange={(e) => setContentPageForm((prev) => ({ ...prev, published: e.target.checked }))} />
              Published
            </label>
            <Button type="submit" className="rounded-full">Save Content Page</Button>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-1">
              {contentPages.map((page) => (
                <div key={page.id} className="border border-border rounded-lg p-2">
                  {editingContentPageId === page.id ? (
                    <div className="space-y-2">
                      <Input value={editContentPageForm.slug} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, slug: e.target.value }))} />
                      <Input value={editContentPageForm.title} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, title: e.target.value }))} />
                      <Input value={editContentPageForm.titleRw} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, titleRw: e.target.value }))} placeholder="Kinyarwanda title" />
                      <Input value={editContentPageForm.description} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, description: e.target.value }))} />
                      <Input value={editContentPageForm.descriptionRw} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, descriptionRw: e.target.value }))} placeholder="Kinyarwanda description" />
                      <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" value={editContentPageForm.body} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, body: e.target.value }))} />
                      <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" value={editContentPageForm.bodyRw} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, bodyRw: e.target.value }))} placeholder="Kinyarwanda body" />
                      <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" value={editContentPageForm.seoJsonLd} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, seoJsonLd: e.target.value }))} placeholder="SEO JSON-LD" />
                      <p className="text-xs text-muted-foreground">
                        Example keys: `heroEyebrow`, `ctaLabel`, `ctaHref`, `secondaryCtaLabel`, `secondaryCtaHref`, `highlights`, `sections`, `faq`.
                      </p>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editContentPageForm.published} onChange={(e) => setEditContentPageForm((prev) => ({ ...prev, published: e.target.checked }))} />
                        Published
                      </label>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingContentPageId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveEditContentPage(page.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{page.title}</p>
                        <p className="text-muted-foreground text-xs">/{page.slug}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEditContentPage(page)}>Edit</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateGiftCard} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Gift Cards</h2>
            <Input
              placeholder="Code (e.g. GIFT50)"
              value={giftCardForm.code}
              onChange={(e) => setGiftCardForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              required
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Balance"
              value={giftCardForm.balance}
              onChange={(e) => setGiftCardForm((prev) => ({ ...prev, balance: e.target.value }))}
              required
            />
            <Button type="submit" className="rounded-full">Save Gift Card</Button>
            <div className="space-y-2 text-sm">
              {giftCards.slice(0, 8).map((card) => (
                <div key={card.code} className="border border-border rounded-lg p-2 flex justify-between">
                  <span>{card.code}</span>
                  <span>{formatCurrency(Number(card.balance))}</span>
                </div>
              ))}
            </div>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Abandoned Cart Recovery</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
              <Input
                placeholder="Target email (optional)"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
              <select
                value={recoveryChannel}
                onChange={(e) => setRecoveryChannel(e.target.value as "email" | "sms")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <Button variant="outline" onClick={triggerRecoveryJourney}>Run Recovery Journey</Button>
            </div>
            <div className="space-y-2 text-sm">
              {abandonedRows.slice(0, 8).map((row, index) => (
                <div key={`${row.createdAt}-${index}`} className="border border-border rounded-lg p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p>{row.email || "Guest"} abandoned {row.itemCount} item(s)</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                    </div>
                    {row.email && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setRecoveryEmail(row.email || "")}
                      >
                        Target
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {pricingRules && (
          <section className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">Dynamic Pricing Rules</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(pricingRules).map(([name, rule]) => (
                <div key={name} className="border border-border rounded-lg p-2 flex justify-between">
                  <span>{name}</span>
                  <span>
                    threshold {rule.threshold}, {rule.markupPercent ? `+${rule.markupPercent}%` : `-${rule.markdownPercent || 0}%`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateBlogPost} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Blog Posts</h2>
            <Input placeholder="Slug" value={blogPostForm.slug} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, slug: e.target.value }))} required />
            <Input placeholder="Title" value={blogPostForm.title} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, title: e.target.value }))} required />
            <Input placeholder="Kinyarwanda title" value={blogPostForm.titleRw} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, titleRw: e.target.value }))} />
            <Input placeholder="Excerpt" value={blogPostForm.excerpt} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, excerpt: e.target.value }))} required />
            <Input placeholder="Kinyarwanda excerpt" value={blogPostForm.excerptRw} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, excerptRw: e.target.value }))} />
            <textarea className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" placeholder="Body" value={blogPostForm.body} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, body: e.target.value }))} required />
            <textarea className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" placeholder="Kinyarwanda body" value={blogPostForm.bodyRw} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, bodyRw: e.target.value }))} />
            <Input placeholder="Cover image URL" value={blogPostForm.coverImageUrl} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={blogPostForm.published} onChange={(e) => setBlogPostForm((prev) => ({ ...prev, published: e.target.checked }))} />
              Published
            </label>
            <Button type="submit" className="rounded-full">Save Blog Post</Button>
            <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-1">
              {blogPosts.map((post) => (
                <div key={post.id} className="border border-border rounded-lg p-2">
                  {editingBlogPostId === post.id ? (
                    <div className="space-y-2">
                      <Input value={editBlogPostForm.slug} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, slug: e.target.value }))} />
                      <Input value={editBlogPostForm.title} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, title: e.target.value }))} />
                      <Input value={editBlogPostForm.titleRw} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, titleRw: e.target.value }))} placeholder="Kinyarwanda title" />
                      <Input value={editBlogPostForm.excerpt} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, excerpt: e.target.value }))} />
                      <Input value={editBlogPostForm.excerptRw} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, excerptRw: e.target.value }))} placeholder="Kinyarwanda excerpt" />
                      <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" value={editBlogPostForm.body} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, body: e.target.value }))} />
                      <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm w-full" value={editBlogPostForm.bodyRw} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, bodyRw: e.target.value }))} placeholder="Kinyarwanda body" />
                      <Input value={editBlogPostForm.coverImageUrl} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))} placeholder="Cover image URL" />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editBlogPostForm.published} onChange={(e) => setEditBlogPostForm((prev) => ({ ...prev, published: e.target.checked }))} />
                        Published
                      </label>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingBlogPostId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveEditBlogPost(post.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-muted-foreground text-xs">/{post.slug}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEditBlogPost(post)}>Edit</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Product Conversations</h2>
                <p className="text-sm text-muted-foreground">Answer customer product questions directly in the app.</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {questions.filter((item) => !item.answer).length} open
              </span>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No product questions yet.</p>
              ) : (
                questions.map((item) => (
                  <div key={item.id} className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/product/${item.productId}`} className="font-medium hover:underline">
                        {item.productName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                      <p className="font-medium mb-1">Customer</p>
                      <p>{item.question}</p>
                    </div>
                    {item.answer ? (
                      <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm">
                        <p className="font-medium mb-1">Your reply</p>
                        <p>{item.answer}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write your reply here"
                          value={questionReplies[item.id] || ""}
                          onChange={(e) => setQuestionReplies((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        <Button onClick={() => handleQuestionReply(item.id)}>Send</Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Review Moderation</h2>
                <p className="text-sm text-muted-foreground">Spot low ratings, media reviews, and anything that should be removed.</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {reviews.length} reviews
              </span>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                reviews.slice(0, 20).map((review) => (
                  <div key={review.id} className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link href={`/product/${review.productId}`} className="font-medium hover:underline">
                          {review.productName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{review.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(Number(review.rating))}/5</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-muted px-2 py-1">{review.verifiedPurchase ? "Verified purchase" : "Unverified"}</span>
                      {review.photoUrl && <span className="rounded-full bg-muted px-2 py-1">Photo</span>}
                      {review.videoUrl && <span className="rounded-full bg-muted px-2 py-1">Video</span>}
                    </div>
                    <p className="text-sm">{review.comment}</p>
                    <div className="flex flex-wrap gap-2">
                      {review.photoUrl && (
                        <img src={review.photoUrl} alt="Review media" className="h-16 w-16 rounded-lg object-cover border border-border" />
                      )}
                      {review.videoUrl && (
                        <video src={review.videoUrl} className="h-16 w-24 rounded-lg border border-border bg-black" />
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>
                        Delete review
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Support Inbox</h2>
                <p className="text-sm text-muted-foreground">Move customer issues from open to resolved without leaving admin.</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {supportInbox.filter((ticket) => ticket.status !== "resolved").length} open
              </span>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              {supportInbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">No support tickets yet.</p>
              ) : (
                supportInbox.slice(0, 20).map((ticket) => (
                  <div key={ticket.id} className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{ticket.topic}</p>
                        <p className="text-xs text-muted-foreground">{ticket.userEmail || ticket.contactEmail || "Guest contact"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs rounded-full bg-muted px-2 py-1 capitalize inline-block">{ticket.status.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDateTime(ticket.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm">{ticket.message}</p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleSupportStatusUpdate(ticket.id, "open")}>Open</Button>
                      <Button size="sm" variant="outline" onClick={() => handleSupportStatusUpdate(ticket.id, "in_progress")}>In Progress</Button>
                      <Button size="sm" onClick={() => handleSupportStatusUpdate(ticket.id, "resolved")}>Resolve</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={createVendor} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Vendors</h2>
            <Input placeholder="Vendor name" value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <Input placeholder="Slug" value={vendorForm.slug} onChange={(e) => setVendorForm((prev) => ({ ...prev, slug: e.target.value }))} required />
            <Input type="email" placeholder="Contact email" value={vendorForm.contactEmail} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactEmail: e.target.value }))} required />
            <Button type="submit" className="rounded-full">Add Vendor</Button>
            <div className="space-y-2 text-sm">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="border border-border rounded-lg p-2">{vendor.name} ({vendor.contactEmail})</div>
              ))}
            </div>
          </form>

          <form onSubmit={createPromotion} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Promotions</h2>
            <Input placeholder="Promotion name" value={promotionForm.name} onChange={(e) => setPromotionForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={promotionForm.type} onChange={(e) => setPromotionForm((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
                <option value="bogo">BOGO</option>
              </select>
              <Input type="number" step="0.01" placeholder="Value" value={promotionForm.value} onChange={(e) => setPromotionForm((prev) => ({ ...prev, value: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={promotionForm.startsAt} onChange={(e) => setPromotionForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
              <Input type="datetime-local" value={promotionForm.endsAt} onChange={(e) => setPromotionForm((prev) => ({ ...prev, endsAt: e.target.value }))} />
            </div>
            <Button type="submit" className="rounded-full">Create Promotion</Button>
            <div className="space-y-2 text-sm">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="border border-border rounded-lg p-2">{promotion.name} ({promotion.type})</div>
              ))}
            </div>
          </form>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">Inventory Forecast</h2>
            <div className="space-y-2 text-sm">
              {forecastRows.slice(0, 8).map((row) => (
                <div key={row.productId} className="border border-border rounded-lg p-2">
                  {row.productName} - {row.avgDailySales}/day, stock-out in {row.forecastDaysUntilOut ?? "N/A"} days
                </div>
              ))}
            </div>
          </div>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-display text-2xl font-semibold mb-3">Return Workflow</h2>
            <div className="space-y-2 text-sm">
              {returnRows.slice(0, 8).map((row) => (
                <div key={row.id} className="border border-border rounded-lg p-2 flex items-center justify-between">
                  <span>Return #{row.id} (Order {row.orderId})</span>
                  <span className="capitalize">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-display text-2xl font-semibold">Products</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search product..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-52"
              />
              <Button variant="outline" onClick={handleRestockLow}>Restock Low</Button>
            </div>
          </div>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="border-b border-border pb-3">
                {editingProductId === p.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm rounded-xl border border-border bg-muted/20 p-4">
                    <Input
                      placeholder="Name"
                      value={editProductForm.name}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Kinyarwanda name"
                      value={editProductForm.nameRw}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, nameRw: e.target.value }))}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={editProductForm.price}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                    <Input
                      placeholder="Description"
                      value={editProductForm.description}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="md:col-span-2"
                    />
                    <Input
                      placeholder="Kinyarwanda description"
                      value={editProductForm.descriptionRw}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, descriptionRw: e.target.value }))}
                      className="md:col-span-2"
                    />
                    <Input
                      placeholder="Image URL"
                      value={editProductForm.imageUrl}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="md:col-span-2"
                    />
                    <Input
                      placeholder="Gallery URLs (comma-separated)"
                      value={editProductForm.imageGallery}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, imageGallery: e.target.value }))}
                      className="md:col-span-2"
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Category ID"
                      value={editProductForm.categoryId}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Stock"
                      value={editProductForm.stockQuantity}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={editProductForm.vendorId}
                      onChange={(e) => setEditProductForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                    >
                      <option value="">No vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editProductForm.isFeatured}
                        onChange={(e) => setEditProductForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                      />
                      Featured product
                    </label>
                    <div className="md:col-span-2 flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEditProduct}>Cancel</Button>
                      <Button size="sm" onClick={() => saveEditProduct(p.id)}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2 items-center text-sm">
                    <span className="col-span-4 line-clamp-1">{p.name}</span>
                    <span className="col-span-2">{formatCurrency(Number(p.price))}</span>
                    <span className="col-span-2">Stock {p.stockQuantity}</span>
                    <span className="col-span-2">{p.isFeatured ? "Featured" : "Standard"}</span>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditProduct(p)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex flex-col gap-3 mb-4">
            <h2 className="font-display text-2xl font-semibold">Order Management</h2>
            <div className="grid sm:grid-cols-5 gap-2">
              <Input
                placeholder="Search order/email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={orderFilter.status}
                onChange={(e) => setOrderFilter((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Status</option>
                {["pending", "packed", "shipped", "delivered", "cancelled", "paid", "payment_failed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={orderFilter.paymentStatus}
                onChange={(e) => setOrderFilter((prev) => ({ ...prev, paymentStatus: e.target.value }))}
              >
                <option value="">All Payment Status</option>
                {["pending", "paid", "payment_failed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                type="date"
                value={orderFilter.dateFrom}
                onChange={(e) => setOrderFilter((prev) => ({ ...prev, dateFrom: e.target.value }))}
              />
              <Input
                type="date"
                value={orderFilter.dateTo}
                onChange={(e) => setOrderFilter((prev) => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
          {selectedOrderId && (
            <div className="mb-5 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">Order Detail</h3>
                  <p className="text-sm text-muted-foreground">Inspect items, payment, delivery, and return activity.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(null)}>
                  Close
                </Button>
              </div>
              {isOrderDetailLoading ? (
                <p className="text-sm text-muted-foreground">Loading order details...</p>
              ) : selectedOrderDetail ? (
                <div className="space-y-4 text-sm">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{selectedOrderDetail.order.customerName}</p>
                      <p className="text-muted-foreground">{selectedOrderDetail.order.customerEmail}</p>
                      {selectedOrderDetail.order.customerPhone && (
                        <p className="text-muted-foreground">{selectedOrderDetail.order.customerPhone}</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-muted-foreground">Payment</p>
                      <p className="font-medium capitalize">{(selectedOrderDetail.order.paymentMethod || "cash on delivery").replace("cod", "cash on delivery")}</p>
                      <p className="text-muted-foreground capitalize">{selectedOrderDetail.order.paymentStatus || "pending"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-muted-foreground">Delivery</p>
                      <p className="font-medium">{selectedOrderDetail.order.deliverySlot || "Standard delivery"}</p>
                      <p className="text-muted-foreground">{selectedOrderDetail.order.city}, {selectedOrderDetail.order.country}</p>
                      {selectedOrderDetail.order.shippingService && (
                        <p className="text-muted-foreground capitalize mt-1">{selectedOrderDetail.order.shippingService.replace("_", " ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-muted-foreground mb-2">Shipping address</p>
                    <p className="font-medium">{selectedOrderDetail.order.shippingAddress}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="font-medium mb-3">Items</p>
                    <div className="space-y-2">
                      {selectedOrderDetail.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-border pb-2">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-muted-foreground">Qty {item.quantity} x {formatOrderMoney(item.unitPrice, selectedOrderDetail.order, formatCurrency)}</p>
                          </div>
                          <p>{formatOrderMoney(item.lineTotal, selectedOrderDetail.order, formatCurrency)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="font-medium mb-2">Totals</p>
                      <p className="text-muted-foreground">Subtotal: {formatOrderMoney(selectedOrderDetail.order.subtotal, selectedOrderDetail.order, formatCurrency)}</p>
                      <p className="text-muted-foreground">Shipping: {formatOrderMoney(selectedOrderDetail.order.shippingFee, selectedOrderDetail.order, formatCurrency)}</p>
                      <p className="text-muted-foreground">Tax: {formatOrderMoney(selectedOrderDetail.order.tax, selectedOrderDetail.order, formatCurrency)}</p>
                      <p className="font-medium mt-2">Total: {formatOrderMoney(selectedOrderDetail.order.total, selectedOrderDetail.order, formatCurrency)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="font-medium mb-2">Notifications</p>
                      {selectedOrderNotifications ? (
                        <>
                          <p className="text-muted-foreground">{selectedOrderNotifications.emailMessage}</p>
                          <p className="text-muted-foreground mt-2">{selectedOrderNotifications.smsMessage}</p>
                          <p className="text-xs text-muted-foreground mt-2">Notification logs: {selectedOrderNotifications.logCount ?? 0}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No notification preview available.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="font-medium mb-2">Payment recovery</p>
                    {selectedOrderResumePayment ? (
                      <>
                        <p className="text-muted-foreground capitalize">
                          {selectedOrderResumePayment.method} via {selectedOrderResumePayment.provider}
                        </p>
                        <p className="text-muted-foreground">
                          Expires {formatDateTime(selectedOrderResumePayment.expiresAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(selectedOrderResumePayment.checkoutUrl, "_blank", "noopener,noreferrer")}
                          >
                            Open payment
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCopyResumePaymentLink}>
                            Copy link
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleGeneratePaymentLink} disabled={isGeneratingPaymentLink}>
                            {isGeneratingPaymentLink ? "Refreshing..." : "Refresh link"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">No active payment session is available for this order.</p>
                        {selectedOrderDetail.order.paymentMethod !== "cod" && selectedOrderDetail.order.paymentStatus !== "paid" && (
                          <Button size="sm" onClick={handleGeneratePaymentLink} disabled={isGeneratingPaymentLink}>
                            {isGeneratingPaymentLink ? "Generating..." : "Generate payment link"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="font-medium mb-2">Shipment tracking</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Carrier"
                        value={shipmentForm.carrier}
                        onChange={(e) => setShipmentForm((prev) => ({ ...prev, carrier: e.target.value }))}
                      />
                      <Input
                        placeholder="Tracking number"
                        value={shipmentForm.trackingNumber}
                        onChange={(e) => setShipmentForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                      />
                      <Input
                        placeholder="Tracking URL"
                        value={shipmentForm.trackingUrl}
                        onChange={(e) => setShipmentForm((prev) => ({ ...prev, trackingUrl: e.target.value }))}
                      />
                      <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={shipmentForm.markStatus}
                        onChange={(e) => setShipmentForm((prev) => ({ ...prev, markStatus: e.target.value }))}
                      >
                        {["packed", "shipped", "delivered"].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      className="mt-3"
                      placeholder="Shipment note"
                      value={shipmentForm.shippingNote}
                      onChange={(e) => setShipmentForm((prev) => ({ ...prev, shippingNote: e.target.value }))}
                    />
                    {(selectedOrderDetail.order.shipmentCarrier || selectedOrderDetail.order.trackingNumber) && (
                      <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="font-medium">{selectedOrderDetail.order.shipmentCarrier || "Carrier pending"}</p>
                        {selectedOrderDetail.order.trackingNumber && <p className="text-muted-foreground">{selectedOrderDetail.order.trackingNumber}</p>}
                        {selectedOrderDetail.order.trackingUrl && (
                          <button
                            type="button"
                            className="mt-1 text-primary underline"
                            onClick={() => window.open(selectedOrderDetail.order.trackingUrl || "", "_blank", "noopener,noreferrer")}
                          >
                            Open carrier tracking
                          </button>
                        )}
                      </div>
                    )}
                    <div className="mt-3">
                      <Button size="sm" onClick={handleSaveShipment}>Save shipment</Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="font-medium mb-2">Return activity</p>
                    {selectedOrderReturns.length === 0 ? (
                      <p className="text-muted-foreground">No returns linked to this order.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedOrderReturns.map((row) => (
                          <div key={row.id} className="rounded-lg border border-border p-3">
                            <p className="font-medium capitalize">{row.status}</p>
                            {row.reason && <p className="text-muted-foreground">{row.reason}</p>}
                            {row.resolution && (
                              <p className="text-xs text-muted-foreground capitalize mt-1">
                                Resolution: {row.resolution.replace("_", " ")}
                              </p>
                            )}
                            {row.refundAmount && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Refund: {row.refundCurrency || "USD"} {row.refundAmount}
                              </p>
                            )}
                            {row.adminNote && <p className="text-xs text-muted-foreground mt-1">{row.adminNote}</p>}
                            <div className="mt-3 grid md:grid-cols-[160px_1fr_120px_auto] gap-2">
                              <select
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={returnUpdateDrafts[row.id]?.status || row.status}
                                onChange={(e) => setReturnUpdateDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: {
                                    status: e.target.value,
                                    note: prev[row.id]?.note || "",
                                    refundAmount: prev[row.id]?.refundAmount || "",
                                  },
                                }))}
                              >
                                {["requested", "approved", "received", "refund_pending", "rejected", "refunded"].map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <Input
                                placeholder="Admin note"
                                value={returnUpdateDrafts[row.id]?.note || ""}
                                onChange={(e) => setReturnUpdateDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: {
                                    status: prev[row.id]?.status || row.status,
                                    note: e.target.value,
                                    refundAmount: prev[row.id]?.refundAmount || "",
                                  },
                                }))}
                              />
                              <Input
                                placeholder="Refund"
                                value={returnUpdateDrafts[row.id]?.refundAmount || ""}
                                onChange={(e) => setReturnUpdateDrafts((prev) => ({
                                  ...prev,
                                  [row.id]: {
                                    status: prev[row.id]?.status || row.status,
                                    note: prev[row.id]?.note || "",
                                    refundAmount: e.target.value,
                                  },
                                }))}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleUpdateReturn(row.id)}>
                                Update
                              </Button>
                            </div>
                            {row.timeline && row.timeline.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {row.timeline.map((event) => (
                                  <div key={event.id} className="rounded bg-muted/40 px-3 py-2">
                                    <p className="font-medium capitalize">{event.status}</p>
                                    {event.note && <p className="text-muted-foreground">{event.note}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Order detail could not be loaded.</p>
              )}
            </div>
          )}
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="grid grid-cols-12 gap-2 items-center text-sm border-b border-border pb-3">
                <span className="col-span-2 line-clamp-1">{o.orderNumber}</span>
                <span className="col-span-2 line-clamp-1">{o.customerEmail}</span>
                <span className="col-span-2">{formatOrderMoney(o.total, o, formatCurrency)}</span>
                <div className="col-span-2">
                  <p className="capitalize">{o.status}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.paymentStatus || "pending"} payment</p>
                </div>
                <div className="col-span-1 text-xs text-muted-foreground capitalize">
                  {(o.paymentMethod || "cod").replace("cod", "cash")}
                </div>
                <div className="col-span-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleViewOrder(o.id)}>
                    View
                  </Button>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={orderStatus[o.id] || o.status}
                    onChange={(e) => setOrderStatus((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  >
                    {["pending", "packed", "shipped", "delivered", "cancelled", "paid", "payment_failed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(o.id)}>Save</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
