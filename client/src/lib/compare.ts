const COMPARE_STORAGE_KEY = "compare-products";

export function getCompareProductIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value) => Number.isFinite(value)) : [];
  } catch {
    return [];
  }
}

export function saveCompareProductIds(ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids.slice(-4)));
}

export function toggleCompareProduct(id: number): number[] {
  const current = getCompareProductIds();
  const next = current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id].slice(-4);
  saveCompareProductIds(next);
  return next;
}
