import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCompareProducts } from "@/hooks/use-products";
import { getCompareProductIds, saveCompareProductIds } from "@/lib/compare";
import { useI18n } from "@/lib/i18n";
import { useSeo } from "@/hooks/use-seo";

export default function CompareProducts() {
  const { t, formatCurrency, formatNumber } = useI18n();
  useSeo("Compare Products - UrugoBuy", "Review products side by side before you buy.", { canonicalPath: "/compare" });
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const { data: products = [] } = useCompareProducts(compareIds);

  useEffect(() => {
    setCompareIds(getCompareProductIds());
  }, []);

  const removeProduct = (id: number) => {
    const next = compareIds.filter((value) => value !== id);
    setCompareIds(next);
    saveCompareProductIds(next);
  };

  const clearAll = () => {
    setCompareIds([]);
    saveCompareProductIds([]);
  };

  if (compareIds.length < 2) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-3xl mx-auto border border-border rounded-2xl p-10 bg-card text-center">
          <h1 className="font-display text-4xl font-bold mb-3">Compare Products</h1>
          <p className="text-muted-foreground mb-8">Choose at least two products to review prices, ratings, and stock side by side.</p>
          <Button asChild className="rounded-full">
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Compare Products</h1>
            <p className="text-muted-foreground">See the most important buying details together before you decide.</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={clearAll}>Clear compare list</Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left">{t("product.tablePrice")}</th>
                <th className="p-4 text-left">{t("product.tableRating")}</th>
                <th className="p-4 text-left">{t("product.tableStock")}</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product.id} className="border-t border-border align-top">
                  <td className="p-4">
                    <Link href={`/product/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  </td>
                  <td className="p-4">{formatCurrency(product.price)}</td>
                  <td className="p-4">{formatNumber(product.rating)}</td>
                  <td className="p-4">{product.stockQuantity}</td>
                  <td className="p-4">{product.categoryId ?? "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/product/${product.id}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeProduct(product.id)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
