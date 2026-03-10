import { db } from "./db";
import {
  categories,
  orderItems,
  orders,
  products,
  subscribers,
  type Category,
  type InsertOrder,
  type InsertOrderItem,
  type Product,
  type Order,
  type OrderItem,
  type Subscriber,
  type InsertSubscriber,
} from "@shared/schema";
import { eq, ilike, and, gte, inArray, sql, asc, desc } from "drizzle-orm";

type CartLineInput = {
  productId: number;
  quantity: number;
};

type OrderInput = {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  country: string;
  items: CartLineInput[];
};

type OrderQuote = {
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
};

type OrderDetail = {
  order: Order;
  items: OrderItem[];
};

export interface IStorage {
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getProducts(filters?: {
    categoryId?: number;
    featured?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";
    search?: string;
  }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  subscribe(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getCheckoutQuote(input: { items: CartLineInput[] }): Promise<OrderQuote>;
  createOrder(input: OrderInput): Promise<{ id: number; orderNumber: string; total: number; status: string }>;
  getOrder(id: number): Promise<OrderDetail | undefined>;
}

type ProductLike = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageGallery: string[];
  categoryId?: number | null;
  vendorId?: number | null;
  rating: number;
  isFeatured: boolean;
  stockQuantity: number;
};

export class DatabaseStorage implements IStorage {
  private applyDynamicPricing(product: ProductLike): ProductLike {
    const basePrice = Number(product.price);
    let nextPrice = basePrice;

    if (product.stockQuantity <= 2) {
      nextPrice = basePrice * 1.2;
    } else if (product.stockQuantity <= 5) {
      nextPrice = basePrice * 1.1;
    } else if (product.isFeatured && product.stockQuantity >= 40) {
      nextPrice = basePrice * 0.95;
    }

    return {
      ...product,
      price: roundCurrency(nextPrice),
    };
  }

  private toSharedProduct(product: ProductLike): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price).toFixed(2),
      imageUrl: product.imageUrl,
      imageGallery: Array.isArray(product.imageGallery) ? product.imageGallery : [],
      categoryId: product.categoryId ?? null,
      vendorId: product.vendorId ?? null,
      rating: Number(product.rating).toFixed(1),
      isFeatured: Boolean(product.isFeatured),
      stockQuantity: product.stockQuantity,
    };
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getProducts(filters?: {
    categoryId?: number;
    featured?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";
    search?: string;
  }): Promise<Product[]> {
    let query = db.select().from(products).$dynamic();
    const conditions = [];

    if (filters?.categoryId !== undefined) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters?.featured !== undefined) conditions.push(eq(products.isFeatured, filters.featured));
    if (filters?.inStock) conditions.push(gte(products.stockQuantity, 1));
    if (filters?.minPrice !== undefined) conditions.push(sql`${products.price} >= ${filters.minPrice}`);
    if (filters?.maxPrice !== undefined) conditions.push(sql`${products.price} <= ${filters.maxPrice}`);
    if (filters?.search) conditions.push(ilike(products.name, `%${filters.search}%`));
    if (conditions.length > 0) query = query.where(and(...conditions));

    switch (filters?.sort) {
      case "price-asc":
        query = query.orderBy(asc(products.price));
        break;
      case "price-desc":
        query = query.orderBy(desc(products.price));
        break;
      case "rating-desc":
        query = query.orderBy(desc(products.rating));
        break;
      case "name-asc":
        query = query.orderBy(asc(products.name));
        break;
      case "newest":
      default:
        query = query.orderBy(desc(products.id));
        break;
    }

    const rows = await query;
    return rows.map((row) =>
      this.toSharedProduct(
        this.applyDynamicPricing({
          id: row.id,
          name: row.name,
          description: row.description,
          price: Number(row.price),
          imageUrl: row.imageUrl,
          imageGallery: row.imageGallery,
          categoryId: row.categoryId ?? null,
          vendorId: row.vendorId ?? null,
          rating: Number(row.rating),
          isFeatured: Boolean(row.isFeatured),
          stockQuantity: row.stockQuantity,
        }),
      ),
    );
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [row] = await db.select().from(products).where(eq(products.id, id));
    if (!row) return undefined;
    return this.toSharedProduct(
      this.applyDynamicPricing({
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        imageUrl: row.imageUrl,
        imageGallery: row.imageGallery,
        categoryId: row.categoryId ?? null,
        vendorId: row.vendorId ?? null,
        rating: Number(row.rating),
        isFeatured: Boolean(row.isFeatured),
        stockQuantity: row.stockQuantity,
      }),
    );
  }

  async subscribe(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [newSubscriber] = await db.insert(subscribers).values(subscriber).returning();
    return newSubscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber;
  }

  async getCheckoutQuote(input: { items: CartLineInput[] }): Promise<OrderQuote> {
    const productIds = Array.from(new Set(input.items.map((line) => line.productId)));
    const rows = await db.select().from(products).where(inArray(products.id, productIds));
    if (rows.length !== productIds.length) throw new Error("One or more products were not found");

    const productMap = new Map(rows.map((p) => [p.id, p]));
    let subtotal = 0;
    for (const line of input.items) {
      const product = productMap.get(line.productId);
      if (!product) throw new Error(`Product ${line.productId} does not exist`);
      if (product.stockQuantity < line.quantity) {
        throw new Error(`${product.name} has only ${product.stockQuantity} left in stock`);
      }
      subtotal += Number(this.applyDynamicPricing({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        imageGallery: product.imageGallery,
        categoryId: product.categoryId ?? null,
        vendorId: product.vendorId ?? null,
        rating: Number(product.rating),
        isFeatured: Boolean(product.isFeatured),
        stockQuantity: product.stockQuantity,
      }).price) * line.quantity;
    }

    const roundedSubtotal = roundCurrency(subtotal);
    const shippingFee = roundedSubtotal >= 100 ? 0 : 9.99;
    const tax = roundCurrency(roundedSubtotal * 0.08);
    const total = roundCurrency(roundedSubtotal + shippingFee + tax);
    return { subtotal: roundedSubtotal, shippingFee, tax, total };
  }

  async createOrder(input: OrderInput): Promise<{ id: number; orderNumber: string; total: number; status: string }> {
    const quote = await this.getCheckoutQuote({ items: input.items });
    const orderNumber = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const created = await db.transaction(async (tx) => {
      const orderPayload: InsertOrder = {
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        shippingAddress: input.shippingAddress,
        city: input.city,
        country: input.country,
        subtotal: quote.subtotal.toFixed(2),
        shippingFee: quote.shippingFee.toFixed(2),
        tax: quote.tax.toFixed(2),
        total: quote.total.toFixed(2),
        status: "pending",
      };
      const [order] = await tx.insert(orders).values(orderPayload).returning();
      const productIds = Array.from(new Set(input.items.map((line) => line.productId)));
      const rows = await tx.select().from(products).where(inArray(products.id, productIds));
      const productMap = new Map(rows.map((p) => [p.id, p]));
      const itemRows: InsertOrderItem[] = [];
      for (const line of input.items) {
        const product = productMap.get(line.productId);
        if (!product) throw new Error(`Product ${line.productId} does not exist`);
        const updated = await tx
          .update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${line.quantity}` })
          .where(and(eq(products.id, line.productId), gte(products.stockQuantity, line.quantity)))
          .returning({ id: products.id });
        if (updated.length === 0) throw new Error(`${product.name} is out of stock`);
        const priced = this.applyDynamicPricing({
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          imageGallery: product.imageGallery,
          categoryId: product.categoryId ?? null,
          vendorId: product.vendorId ?? null,
          rating: Number(product.rating),
          isFeatured: Boolean(product.isFeatured),
          stockQuantity: product.stockQuantity,
        });
        itemRows.push({
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          unitPrice: Number(priced.price).toFixed(2),
          quantity: line.quantity,
          lineTotal: (Number(priced.price) * line.quantity).toFixed(2),
        });
      }
      await tx.insert(orderItems).values(itemRows);
      return order;
    });
    return {
      id: created.id,
      orderNumber: created.orderNumber,
      total: Number(created.total),
      status: created.status,
    };
  }

  async getOrder(id: number): Promise<OrderDetail | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { order, items };
  }
}

export const storage = new DatabaseStorage();

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
