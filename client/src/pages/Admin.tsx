import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { authFetch } from "@/lib/auth";
import { normalizeProductImageUrl } from "@/lib/images";

type AdminProduct = {
  id: number;
  name: string;
  price: string;
  stockQuantity: number;
  isFeatured: boolean | null;
};

type AdminOrder = {
  id: number;
  orderNumber: string;
  customerEmail: string;
  total: string;
  status: string;
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

export default function Admin() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [forecastRows, setForecastRows] = useState<Array<{ productId: number; productName: string; stockQuantity: number; avgDailySales: number; forecastDaysUntilOut: number | null }>>([]);
  const [returnRows, setReturnRows] = useState<Array<{ id: number; orderId: number; status: string }>>([]);
  const [abandonedRows, setAbandonedRows] = useState<Array<{ email?: string; itemCount: number; createdAt: string }>>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [pricingRules, setPricingRules] = useState<Record<string, { threshold: number; markupPercent?: number; markdownPercent?: number }> | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
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
  const [orderFilter, setOrderFilter] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [giftCardForm, setGiftCardForm] = useState({ code: "", balance: "" });

  const loadAll = async () => {
    const orderParams = new URLSearchParams();
    if (orderSearch) orderParams.set("search", orderSearch);
    if (orderFilter.status) orderParams.set("status", orderFilter.status);
    if (orderFilter.dateFrom) orderParams.set("dateFrom", orderFilter.dateFrom);
    if (orderFilter.dateTo) orderParams.set("dateTo", orderFilter.dateTo);

    const productParams = new URLSearchParams();
    if (productSearch) productParams.set("search", productSearch);

    const [p, o, a, adv, v, promo, forecast, returns, abandoned, gc, pricing] = await Promise.all([
      authFetch(`/api/admin/products${productParams.toString() ? `?${productParams.toString()}` : ""}`),
      authFetch(`/api/admin/orders${orderParams.toString() ? `?${orderParams.toString()}` : ""}`),
      authFetch("/api/admin/analytics"),
      authFetch("/api/admin/analytics/advanced"),
      authFetch("/api/admin/vendors"),
      authFetch("/api/admin/promotions"),
      authFetch("/api/admin/inventory/forecast"),
      authFetch("/api/admin/returns"),
      authFetch("/api/admin/abandoned-carts"),
      authFetch("/api/admin/gift-cards"),
      authFetch("/api/admin/pricing/rules"),
    ]);
    if (p.ok) setProducts(await p.json());
    if (o.ok) setOrders(await o.json());
    if (a.ok) setAnalytics(await a.json());
    if (adv.ok) setAdvancedAnalytics(await adv.json());
    if (v.ok) setVendors(await v.json());
    if (promo.ok) setPromotions(await promo.json());
    if (forecast.ok) setForecastRows(await forecast.json());
    if (returns.ok) setReturnRows(await returns.json());
    if (abandoned.ok) setAbandonedRows(await abandoned.json());
    if (gc.ok) setGiftCards(await gc.json());
    if (pricing.ok) setPricingRules(await pricing.json());
  };

  useEffect(() => {
    if (token) {
      loadAll().catch(() => undefined);
    }
  }, [token, productSearch, orderSearch, orderFilter.status, orderFilter.dateFrom, orderFilter.dateTo]);

  if (!user || !token) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-xl mx-auto border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Admin Access Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in with an admin account.</p>
          <Button asChild className="rounded-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-xl mx-auto border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Forbidden</h1>
          <p className="text-muted-foreground">Your account does not have admin permissions.</p>
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
        description: productForm.description,
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
        description: "",
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
    if (res.ok) await loadAll();
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

  const triggerRecoveryJourney = async () => {
    const res = await authFetch("/api/admin/abandoned-carts/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email" }),
    });
    if (res.ok) await loadAll();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage products, orders, and business metrics.</p>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-2xl font-bold">{analytics?.totalOrders ?? 0}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">${(analytics?.revenue ?? 0).toFixed(2)}</p>
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
              <p className="text-xl font-bold">${(advancedAnalytics?.avgOrderValue ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-xl font-bold">{advancedAnalytics?.ordersCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold">${(advancedAnalytics?.revenue ?? 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {advancedAnalytics?.daily?.map((row) => (
              <div key={row.day} className="border border-border rounded-lg p-2 flex items-center justify-between">
                <span>{row.day}</span>
                <span>${row.revenue.toFixed(2)} / {row.orders} orders</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateProduct} className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Add Product</h2>
            <Input placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} required />
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
                  <span>${Number(card.balance).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </form>

          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <h2 className="font-display text-2xl font-semibold">Abandoned Cart Recovery</h2>
            <Button variant="outline" onClick={triggerRecoveryJourney}>Run Recovery Journey</Button>
            <div className="space-y-2 text-sm">
              {abandonedRows.slice(0, 8).map((row, index) => (
                <div key={`${row.createdAt}-${index}`} className="border border-border rounded-lg p-2">
                  <p>{row.email || "Guest"} abandoned {row.itemCount} item(s)</p>
                  <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
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
              <div key={p.id} className="grid grid-cols-12 gap-2 items-center text-sm border-b border-border pb-2">
                <span className="col-span-4 line-clamp-1">{p.name}</span>
                <span className="col-span-2">${Number(p.price).toFixed(2)}</span>
                <span className="col-span-2">Stock {p.stockQuantity}</span>
                <span className="col-span-2">{p.isFeatured ? "Featured" : "Standard"}</span>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border rounded-2xl p-5 bg-card">
          <div className="flex flex-col gap-3 mb-4">
            <h2 className="font-display text-2xl font-semibold">Order Management</h2>
            <div className="grid sm:grid-cols-4 gap-2">
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
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="grid grid-cols-12 gap-2 items-center text-sm border-b border-border pb-3">
                <span className="col-span-3 line-clamp-1">{o.orderNumber}</span>
                <span className="col-span-3 line-clamp-1">{o.customerEmail}</span>
                <span className="col-span-2">${Number(o.total).toFixed(2)}</span>
                <span className="col-span-2 capitalize">{o.status}</span>
                <div className="col-span-2 flex gap-2">
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
